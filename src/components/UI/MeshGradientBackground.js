import React from 'react';
import '../../styles/MeshGradient.css';

function MeshGradientBackground({ variant = 'default' }) {
  const getClassName = () => {
    switch (variant) {
      case 'dashboard':
        return 'mesh-gradient-background mesh-gradient-dashboard';
      case 'subtle':
        return 'mesh-gradient-background mesh-gradient-subtle';
      default:
        return 'mesh-gradient-background';
    }
  };

  return <div className={getClassName()} />;
}

export default MeshGradientBackground; 