// components/Alert.js
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const alertStyles = {
    alertContainer: {
        position: 'fixed',
        top: '35px', // Moved down from 80px to 120px for more central position
        left: '66%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '300px',
        padding: '16px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        backgroundColor: 'white',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        zIndex: 1000,
        wordBreak: 'break-word', // Better handling of long text
    },
    icon: {
        width: '24px',
        height: '24px',
        flexShrink: 0,
    },
    content: {
        flex: 1,
        textAlign: 'center', // Center align the text
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Center align flex items
    },
    title: {
        margin: 0,
        fontSize: '14px',
        fontWeight: 600,
        color: '#111',
        textAlign: 'center', // Ensure title is centered
    },
    message: {
        margin: '4px 0 0',
        fontSize: '14px',
        color: '#666',
        textAlign: 'center', // Ensure message is centered
    },
    closeButton: {
        background: 'none',
        border: 'none',
        padding: '2px',
        cursor: 'pointer',
        color: '#666',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

const getAlertStyles = (type) => {
    const baseStyles = { ...alertStyles.alertContainer };
    
    switch (type) {
        case 'success':
            return {
                ...baseStyles,
                borderLeft: '4px solid #10B981',
                backgroundColor: '#ECFDF5',
            };
        case 'error':
            return {
                ...baseStyles,
                borderLeft: '4px solid #EF4444',
                backgroundColor: '#FEF2F2',
            };
        case 'warning':
            return {
                ...baseStyles,
                borderLeft: '4px solid #F59E0B',
                backgroundColor: '#FFFBEB',
            };
        case 'info':
        default:
            return {
                ...baseStyles,
                borderLeft: '4px solid #3B82F6',
                backgroundColor: '#EFF6FF',
            };
    }
};

const AlertIcon = ({ type }) => {
    const iconStyle = {
        ...alertStyles.icon,
        color: type === 'success' ? '#10B981' 
             : type === 'error' ? '#EF4444'
             : type === 'warning' ? '#F59E0B'
             : '#3B82F6'
    };

    return (
        <div style={iconStyle}>
            {type === 'success' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
            {type === 'error' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
            {type === 'warning' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4m0 4h.01M12 3l9 16H3L12 3z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
            {type === 'info' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4m0-4h.01" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
        </div>
    );
};

function CustomAlert({ type = 'info', title, description, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 6000); // 6 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    const variants = {
        hidden: { 
            opacity: 0,
            y: -20,
        },
        visible: { 
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: 'easeOut'
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: {
                duration: 0.2,
                ease: 'easeIn'
            }
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={variants}
                style={getAlertStyles(type)}
            >
                <AlertIcon type={type} />
                
                <div style={alertStyles.content}>
                    <h4 style={alertStyles.title}>{title}</h4>
                    {description && (
                        <p style={alertStyles.message}>{description}</p>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    style={alertStyles.closeButton}
                    aria-label="Close alert"
                >
                    <X size={16} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}

export default CustomAlert;