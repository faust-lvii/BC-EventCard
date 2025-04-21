import React from 'react';

export enum AlertType {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info'
}

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  message,
  onClose,
  autoClose = false,
  duration = 5000
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">
        {message}
      </div>
      {onClose && (
        <button className="alert-close" onClick={handleClose}>
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert; 