import React, { useCallback, useMemo } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const options = useMemo(() => {
    return {
      fpsLimit: 60,
      particles: {
        number: {
          value: 80,
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
          value: 0.5,
          random: false,
          animation: {
            enable: true,
            speed: 0.5,
            minimumValue: 0.3,
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
          opacity: 0.4,
          width: 1
        },
        move: {
          enable: true,
          speed: 1,
          direction: 'none',
          random: true,
          straight: false,
          outModes: {
            default: 'out'
          },
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200
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
        color: 'transparent',
        opacity: 0
      }
    };
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={options}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  );
};

export default ParticleBackground;
