from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
import json
import qrcode
import uuid
from cryptography.fernet import Fernet
import base64
from io import BytesIO
# Explicitly import PIL for Vercel deployment
from PIL import Image
import logging
import sys
import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Print Python version and environment info
logger.info(f"Python version: {sys.version}")
logger.info(f"Python path: {sys.path}")

app = Flask(__name__, template_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates'), 
           static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static'))
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(24))

# Initialize a simple local blockchain for demonstration
class SimpleBlockchain:
    def __init__(self):
        self.chain = []
        self.create_genesis_block()
        
    def create_genesis_block(self):
        # First block in the chain
        self.chain.append({
            'index': 0,
            'timestamp': 'Genesis Block',
            'data': 'Genesis Data',
            'previous_hash': '0',
            'hash': '0'
        })
        
    def add_card(self, card_data):
        card_id = str(uuid.uuid4())
        new_block = {
            'index': len(self.chain),
            'card_id': card_id,
            'data': card_data,
            'previous_hash': self.chain[-1]['hash'],
            'hash': self._generate_hash(card_data + card_id)
        }
        self.chain.append(new_block)
        return card_id, new_block['hash']
    
    def verify_card(self, card_id, card_hash):
        for block in self.chain:
            if block.get('card_id') == card_id and block.get('hash') == card_hash:
                return True, block['data']
        return False, None
    
    def _generate_hash(self, data):
        # Simple hash function for demonstration
        import hashlib
        return hashlib.sha256(data.encode()).hexdigest()

# Initialize blockchain
blockchain = SimpleBlockchain()

# Generate encryption key
def generate_key():
    return Fernet.generate_key()

# For Vercel, we'll use an environment variable for the key
try:
    logger.info("Starting encryption key setup")
    ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY')
    
    if ENCRYPTION_KEY:
        logger.info("Found ENCRYPTION_KEY in environment variables")
        try:
            # Try to use the key from environment variable
            if isinstance(ENCRYPTION_KEY, str):
                # Make sure it's a valid base64 string
                if len(ENCRYPTION_KEY) % 4 != 0:
                    # Pad the base64 string if needed
                    ENCRYPTION_KEY += '=' * (4 - len(ENCRYPTION_KEY) % 4)
                key = ENCRYPTION_KEY.encode()
            else:
                key = ENCRYPTION_KEY
                
            # Test if the key is valid by creating a Fernet instance
            test_cipher = Fernet(key)
            logger.info("Successfully created Fernet cipher with provided key")
        except Exception as e:
            logger.error(f"Error with provided encryption key: {str(e)}")
            # If there's an error, generate a new key
            key = generate_key()
            logger.info(f"Generated new key: {key.decode()}")
    else:
        # No key provided, generate a new one
        logger.info("No ENCRYPTION_KEY found in environment variables")
        key = generate_key()
        logger.info(f"Generated new key: {key.decode()}")
        logger.info("IMPORTANT: Set this key as ENCRYPTION_KEY in your Vercel environment variables")

    # Create the cipher suite
    cipher_suite = Fernet(key)
    logger.info("Successfully created Fernet cipher suite")
except Exception as global_e:
    logger.error(f"Global exception in encryption setup: {str(global_e)}")
    # Fallback to a new key as last resort
    key = generate_key()
    cipher_suite = Fernet(key)
    logger.info(f"Using fallback key due to global exception: {key.decode()}")

@app.route('/')
def index():
    try:
        logger.info("Rendering index page")
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Error rendering index page: {str(e)}")
        return f"Error rendering index page: {str(e)}", 500

@app.route('/create', methods=['GET', 'POST'])
def create():
    try:
        if request.method == 'POST':
            try:
                logger.info("Starting card creation process")
                # Get form data
                event_name = request.form.get('event_name')
                event_date = request.form.get('event_date')
                event_location = request.form.get('event_location')
                attendee_name = request.form.get('attendee_name')
                ticket_type = request.form.get('ticket_type')
                
                logger.info(f"Received form data: {event_name}, {event_date}, {event_location}, {attendee_name}, {ticket_type}")
                
                # Create card data
                card_data = {
                    'event_name': event_name,
                    'event_date': event_date,
                    'event_location': event_location,
                    'attendee_name': attendee_name,
                    'ticket_type': ticket_type
                }
                
                # Add to blockchain
                logger.info("Adding card to blockchain")
                card_id, card_hash = blockchain.add_card(json.dumps(card_data))
                logger.info(f"Card added with ID: {card_id}")
                
                # Encrypt the card data with the card_id for verification
                verification_data = f"{card_id}:{card_hash}"
                logger.info("Encrypting verification data")
                try:
                    encrypted_data = cipher_suite.encrypt(verification_data.encode()).decode()
                    logger.info("Successfully encrypted verification data")
                except Exception as e:
                    logger.error(f"Error encrypting data: {str(e)}")
                    raise
                
                # Generate QR code
                logger.info("Generating QR code")
                try:
                    qr = qrcode.QRCode(
                        version=1,
                        error_correction=qrcode.constants.ERROR_CORRECT_L,
                        box_size=10,
                        border=4,
                    )
                    qr.add_data(encrypted_data)
                    qr.make(fit=True)
                    
                    img = qr.make_image(fill_color="black", back_color="white")
                    logger.info("QR code image created")
                    
                    # Save QR code to BytesIO object
                    buffered = BytesIO()
                    img.save(buffered)
                    img_str = base64.b64encode(buffered.getvalue()).decode()
                    logger.info("QR code converted to base64 string")
                except Exception as e:
                    logger.error(f"Error generating QR code: {str(e)}")
                    raise
                
                logger.info("Rendering card template")
                return render_template('card.html', 
                                    card_data=card_data, 
                                    qr_code=img_str, 
                                    card_id=card_id,
                                    encrypted_data=encrypted_data)
            except Exception as e:
                # Log the error
                logger.error(f"Error in card creation: {str(e)}")
                # Return an error page
                return render_template('error.html', error=str(e))
        
        logger.info("Rendering create form")
        return render_template('create.html')
    except Exception as e:
        logger.error(f"Unexpected error in create route: {str(e)}")
        return f"Unexpected error: {str(e)}", 500

@app.route('/verify', methods=['GET', 'POST'])
def verify():
    try:
        if request.method == 'POST':
            encrypted_data = request.form.get('encrypted_data')
            logger.info("Starting card verification process")
            
            try:
                # Decrypt the data
                logger.info("Attempting to decrypt verification data")
                decrypted_data = cipher_suite.decrypt(encrypted_data.encode()).decode()
                card_id, card_hash = decrypted_data.split(':')
                logger.info(f"Successfully decrypted data for card ID: {card_id}")
                
                # Verify on blockchain
                logger.info("Verifying card on blockchain")
                is_valid, card_data = blockchain.verify_card(card_id, card_hash)
                
                if is_valid:
                    logger.info("Card verified successfully")
                    card_data = json.loads(card_data)
                    return render_template('verify_result.html', 
                                        is_valid=True, 
                                        card_data=card_data)
                else:
                    logger.warning("Card verification failed - not found in blockchain")
                    return render_template('verify_result.html', 
                                        is_valid=False)
            except Exception as e:
                logger.error(f"Error in card verification: {str(e)}")
                return render_template('verify_result.html', 
                                    is_valid=False, 
                                    error=str(e))
        
        logger.info("Rendering verify form")
        return render_template('verify.html')
    except Exception as e:
        logger.error(f"Unexpected error in verify route: {str(e)}")
        return f"Unexpected error: {str(e)}", 500

# Special route for Vercel health check
@app.route('/_health', methods=['GET'])
def health_check():
    try:
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        logger.error(f"Error in health check route: {str(e)}")
        return render_template('error.html', error=str(e))

# API health check endpoint
@app.route('/api/health', methods=['GET'])
def api_health():
    try:
        # Test the encryption
        test_data = "health_check"
        encrypted = cipher_suite.encrypt(test_data.encode())
        decrypted = cipher_suite.decrypt(encrypted).decode()
        
        if decrypted == test_data:
            return jsonify({
                "status": "ok",
                "encryption": "working",
                "python_version": sys.version,
                "timestamp": str(datetime.datetime.now())
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Encryption test failed"
            }), 500
    except Exception as e:
        logger.error(f"Error in API health check: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# This is for local development
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
