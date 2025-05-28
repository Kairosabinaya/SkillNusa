import React, { useCallback, useMemo } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

const ParticleBackground = ({ variant = 'dashboard' }) => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const dashboardOptions = useMemo(() => {
    return {
      fpsLimit: 60,
      fullScreen: false,
      particles: {
        number: {
          value: 40,
          density: {
            enable: true,
            area: 1500
          }
        },
        color: {
          value: ['#010042', '#0100a3', '#4f46e5', '#6366f1', '#8b5cf6', '#a855f7']
        },
        shape: {
          type: ['circle', 'triangle', 'star', 'polygon'],
          options: {
            star: {
              sides: 5
            },
            polygon: {
              sides: 6
            }
          }
        },
        opacity: {
          value: { min: 0.1, max: 0.4 },
          random: true,
          animation: {
            enable: true,
            speed: 0.6,
            minimumValue: 0.05,
            sync: false
          }
        },
        size: {
          value: { min: 3, max: 12 },
          random: true,
          animation: {
            enable: true,
            speed: 1,
            minimumValue: 2,
            sync: false
          }
        },
        links: {
          enable: true,
          distance: 140,
          color: {
            value: '#010042'
          },
          opacity: 0.12,
          width: 1.5,
          triangles: {
            enable: true,
            opacity: 0.03
          }
        },
        move: {
          enable: true,
          speed: { min: 0.3, max: 1.5 },
          direction: 'none',
          random: true,
          straight: false,
          outModes: {
            default: 'bounce'
          },
          attract: {
            enable: false
          },
          gravity: {
            enable: false
          }
        },
        rotate: {
          value: 0,
          random: true,
          direction: 'clockwise',
          animation: {
            enable: true,
            speed: 1.5,
            sync: false
          }
        }
      },
      interactivity: {
        detectsOn: 'window',
        events: {
          onHover: {
            enable: true,
            mode: ['grab', 'bubble']
          },
          onClick: {
            enable: true,
            mode: 'repulse'
          },
          resize: true
        },
        modes: {
          grab: {
            distance: 160,
            links: {
              opacity: 0.5,
              color: '#0100a3'
            }
          },
          bubble: {
            distance: 250,
            size: 15,
            duration: 1,
            opacity: 0.7
          },
          repulse: {
            distance: 120,
            duration: 0.6
          }
        }
      },
      detectRetina: true,
      background: {
        color: 'transparent'
      }
    };
  }, []);

  const loginOptions = useMemo(() => {
    return {
      fpsLimit: 60,
      fullScreen: false,
      particles: {
        number: {
          value: 120,
          density: {
            enable: true,
            area: 800
          }
        },
        color: {
          value: '#010042'
        },
        shape: {
          type: 'circle'
        },
        opacity: {
          value: 0.3,
          random: true,
          animation: {
            enable: true,
            speed: 1,
            minimumValue: 0.1,
            sync: false
          }
        },
        size: {
          value: 3,
          random: true,
          animation: {
            enable: true,
            speed: 2,
            minimumValue: 0.5,
            sync: false
          }
        },
        links: {
          enable: true,
          distance: 150,
          color: '#010042',
          opacity: 0.2,
          width: 1
        },
        move: {
          enable: true,
          speed: 1.5,
          direction: 'none',
          random: true,
          straight: false,
          outModes: {
            default: 'out'
          }
        }
      },
      interactivity: {
        detectsOn: 'window',
        events: {
          onHover: {
            enable: true,
            mode: 'grab'
          },
          onClick: {
            enable: true,
            mode: 'push'
          },
          resize: true
        },
        modes: {
          grab: {
            distance: 180,
            links: {
              opacity: 0.8,
              color: '#0100a3'
            }
          },
          push: {
            quantity: 4
          }
        }
      },
      detectRetina: true,
      background: {
        color: 'transparent'
      }
    };
  }, []);

  const options = variant === 'dashboard' ? dashboardOptions : loginOptions;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Enhanced gradient overlay with subtle patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white/10 to-purple-50/30 pointer-events-none" />
      
      {/* Geometric patterns overlay */}
      {variant === 'dashboard' && (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#010042" strokeWidth="0.3" opacity="0.08"/>
              </pattern>
              <pattern id="dots" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="25" cy="25" r="0.8" fill="#010042" opacity="0.12"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
      )}
      
      {/* Enhanced floating orbs with better animations */}
      {variant === 'dashboard' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-16 w-40 h-40 bg-gradient-to-r from-blue-200/15 to-indigo-200/15 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/4 right-24 w-56 h-56 bg-gradient-to-r from-purple-200/12 to-pink-200/12 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-32 left-1/3 w-32 h-32 bg-gradient-to-r from-indigo-200/18 to-blue-300/18 rounded-full blur-xl animate-pulse" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-300/10 to-cyan-200/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '5s' }} />
          <div className="absolute top-1/2 left-20 w-28 h-28 bg-gradient-to-r from-violet-200/15 to-purple-300/15 rounded-full blur-lg animate-pulse" style={{ animationDelay: '7s' }} />
        </div>
      )}
      
      <Particles
        id={`tsparticles-${variant}`}
        init={particlesInit}
        options={options}
        className="absolute inset-0 w-full h-full"
        style={{ 
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default ParticleBackground;
