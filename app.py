from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
import json
import qrcode
import uuid
from cryptography.fernet import Fernet
import base64
from io import BytesIO

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(24))

# Initialize a simple local blockchain for demonstration
# In production, you would connect to a real blockchain network
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
        # In production, use a proper cryptographic hash function
        import hashlib
        return hashlib.sha256(data.encode()).hexdigest()

# Initialize blockchain
blockchain = SimpleBlockchain()

# Generate encryption key
def generate_key():
    return Fernet.generate_key()

# For Vercel deployment, use environment variable for the key
# If not available, generate a new one (but note this will reset on each deployment)
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY')
if ENCRYPTION_KEY:
    # Use the key from environment variable
    key = ENCRYPTION_KEY.encode()
else:
    # Generate a new key
    key = generate_key()
    # Print the key so it can be set as an environment variable
    print(f"Generated new key: {key.decode()}")

cipher_suite = Fernet(key)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/create', methods=['GET', 'POST'])
def create():
    if request.method == 'POST':
        # Get form data
        event_name = request.form.get('event_name')
        event_date = request.form.get('event_date')
        event_location = request.form.get('event_location')
        attendee_name = request.form.get('attendee_name')
        ticket_type = request.form.get('ticket_type')
        
        # Create card data
        card_data = {
            'event_name': event_name,
            'event_date': event_date,
            'event_location': event_location,
            'attendee_name': attendee_name,
            'ticket_type': ticket_type
        }
        
        # Add to blockchain
        card_id, card_hash = blockchain.add_card(json.dumps(card_data))
        
        # Encrypt the card data with the card_id for verification
        verification_data = f"{card_id}:{card_hash}"
        encrypted_data = cipher_suite.encrypt(verification_data.encode()).decode()
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(encrypted_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR code to BytesIO object
        buffered = BytesIO()
        img.save(buffered)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return render_template('card.html', 
                              card_data=card_data, 
                              qr_code=img_str, 
                              card_id=card_id,
                              encrypted_data=encrypted_data)
    
    return render_template('create.html')

@app.route('/verify', methods=['GET', 'POST'])
def verify():
    if request.method == 'POST':
        encrypted_data = request.form.get('encrypted_data')
        
        try:
            # Decrypt the data
            decrypted_data = cipher_suite.decrypt(encrypted_data.encode()).decode()
            card_id, card_hash = decrypted_data.split(':')
            
            # Verify on blockchain
            is_valid, card_data = blockchain.verify_card(card_id, card_hash)
            
            if is_valid:
                card_data = json.loads(card_data)
                return render_template('verify_result.html', 
                                      is_valid=True, 
                                      card_data=card_data)
            else:
                return render_template('verify_result.html', 
                                      is_valid=False)
        except Exception as e:
            return render_template('verify_result.html', 
                                  is_valid=False, 
                                  error=str(e))
    
    return render_template('verify.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
