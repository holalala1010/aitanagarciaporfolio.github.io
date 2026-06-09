/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState, useRef, ReactNode } from 'react';

// Inyectar fuentes Google Fonts al inicio
if (typeof window !== 'undefined' && !document.getElementById('google-fonts')) {
  const link = document.createElement('link');
  link.id = 'google-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;700&display=swap';
  document.head.appendChild(link);
}

// Registro de componentes de A-Frame ANTES de renderizar la escena en React
if (typeof window !== 'undefined' && (window as any).AFRAME) {
  if (!(window as any).AFRAME.components['hologram-material']) {
    (window as any).AFRAME.registerComponent('hologram-material', {
      init: function () {
        this.el.addEventListener('model-loaded', () => {
          const obj = this.el.getObject3D('mesh');
          let meshColor: any = null;

          if (obj) {
            obj.traverse((node: any) => {
              if (node.isMesh && node.material) {
                // Efecto holograma: ligeramente más translúcido
                node.material.transparent = true;
                node.material.opacity = 0.50; // Aún un pelín más transparente
                node.material.depthWrite = true; // Restaurar escritura de profundidad para mayor solidez
                node.material.blending = (window as any).THREE.NormalBlending; // Usar mezcla normal para evitar brillo excesivo
                
                // Conservar el color original con un poco más de brillo
                if (node.material.color) {
                  if (!meshColor) meshColor = node.material.color.clone();
                  
                  // Saturación ligera sin quemar el color
                  const hsl = { h: 0, s: 0, l: 0 };
                  node.material.color.getHSL(hsl);
                  node.material.color.setHSL(hsl.h, Math.min(hsl.s * 1.4, 1.0), Math.min(hsl.l * 1.3, 0.75));

                  // Añadir luz propia (emissive) un poco más fuerte
                  node.material.emissive = node.material.color.clone();
                  node.material.emissiveIntensity = 0.95; // Un pelín más brillante
                }
                
                node.material.needsUpdate = true;
              }
            });

            // Calcular el centro y tamaño
            const box = new (window as any).THREE.Box3().setFromObject(obj);
            const worldCenter = new (window as any).THREE.Vector3();
            box.getCenter(worldCenter);
            
            // Convertir el centro a coordenadas locales para posicionar las luces/partículas correctamente
            const center = this.el.object3D.worldToLocal(worldCenter);
            
            const size = new (window as any).THREE.Vector3();
            box.getSize(size);
            
            // Radios de dispersión más amplios y garantizados
            const radiusX = Math.max(size.x * 0.8, 0.2);
            const radiusY = Math.max(size.y * 0.8, 0.2);
            const radiusZ = Math.max(size.z * 0.8, 0.2);

            const hexColor = meshColor ? '#' + meshColor.getHexString() : '#a16ae8';

            // 1. Añadir luz puntual más fuerte en Z para iluminar al personaje que está frente a la pantalla
            const light = document.createElement('a-light');
            light.setAttribute('type', 'point');
            light.setAttribute('color', hexColor);
            light.setAttribute('intensity', '1.4'); // Luz moderada para iluminar sin quemar la escena
            light.setAttribute('distance', '3.5'); 
            // Desplazamos la luz en +Z para que proyecte hacia donde está sentado el personaje
            light.setAttribute('position', `${center.x} ${center.y} ${center.z + 0.4}`);
            this.el.appendChild(light);

            // 2. Partículas un poco más grandes y lentas
            for (let i = 0; i < 6; i++) {
                const particle = document.createElement('a-octahedron');
                particle.setAttribute('radius', '0.007'); // Un pelín más grandes
                particle.setAttribute('color', hexColor);
                particle.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.9');
                
                const p1 = {
                    x: center.x + (Math.random() - 0.5) * radiusX * 2.5,
                    y: center.y + (Math.random() - 0.5) * radiusY * 2.5,
                    z: center.z + (Math.random() - 0.5) * radiusZ * 2.5
                };
                const p2 = {
                    x: center.x + (Math.random() - 0.5) * radiusX * 2.5,
                    y: center.y + (Math.random() - 0.5) * radiusY * 2.5,
                    z: center.z + (Math.random() - 0.5) * radiusZ * 2.5
                };

                particle.setAttribute('position', `${p1.x} ${p1.y} ${p1.z}`);
                
                // Duración suave y muy lenta
                const duration = 12000 + Math.random() * 10000;
                particle.setAttribute('animation', `property: position; to: ${p2.x} ${p2.y} ${p2.z}; dir: alternate; loop: true; dur: ${duration}; easing: easeInOutSine`);

                this.el.appendChild(particle);
            }
          }
        });
      }
    });
  }


  
  // Componente para rotar hacia la cámara
  if (!(window as any).AFRAME.components['look-at-camera']) {
    (window as any).AFRAME.registerComponent('look-at-camera', {
      tick: function () {
        const cameraEl = this.el.sceneEl && this.el.sceneEl.camera ? this.el.sceneEl.camera.el : null;
        if (!cameraEl) return;
        const cameraPos = new (window as any).THREE.Vector3();
        cameraEl.object3D.getWorldPosition(cameraPos);
        const objPos = new (window as any).THREE.Vector3();
        this.el.object3D.getWorldPosition(objPos);
        cameraPos.y = objPos.y; // Mantener altura
        this.el.object3D.lookAt(cameraPos);
      }
    });
  }

  // Componente para hacer brillar el panal
  if (!(window as any).AFRAME.components['honeycomb-glow']) {
    (window as any).AFRAME.registerComponent('honeycomb-glow', {
      init: function () {
        this.el.addEventListener('model-loaded', () => {
          const obj = this.el.getObject3D('mesh');
          if (obj) {
            obj.traverse((node: any) => {
              if (node.isMesh && node.material) {
                node.material.emissive = new (window as any).THREE.Color('#ffcc00');
                node.material.emissiveIntensity = 0.6;
                node.material.needsUpdate = true;
              }
            });
            
            const light = document.createElement('a-light');
            light.setAttribute('type', 'point');
            light.setAttribute('color', '#ffb347');
            light.setAttribute('intensity', '2.5');
            light.setAttribute('distance', '4');
            light.setAttribute('position', '0 1 1');
            this.el.appendChild(light);
            
            const ambient = document.createElement('a-light');
            ambient.setAttribute('type', 'ambient');
            ambient.setAttribute('color', '#fff');
            ambient.setAttribute('intensity', '0.5');
            this.el.appendChild(ambient);
          }
        });
      }
    });
  }

  // Componente para particulas de regadera
  if (!(window as any).AFRAME.components['watering-particles']) {
    (window as any).AFRAME.registerComponent('watering-particles', {
      schema: {
        color: { type: 'color', default: '#a1c4fd' },
        count: { type: 'number', default: 15 }
      },
      init: function () {
        this.particles = [];
        this.emitterNode = null;
        
        this.minY = Infinity;
        this.maxY = -Infinity;
        
        this.el.addEventListener('model-loaded', () => {
          const obj = this.el.getObject3D('mesh');
          if (!obj) return;
          console.log("Buscando Empty en el modelo de regadera...");
          obj.traverse((node: any) => {
            if (node.name.toLowerCase().includes('empty') || node.name.toLowerCase().includes('water') || node.name.toLowerCase().includes('drop')) {
              this.emitterNode = node;
            }
          });
          
          if (!this.emitterNode) {
             console.warn("No se encontro un node 'Empty' o 'water' en el modelo de regadera.");
          } else {
             console.log("Nodo emisor encontrado:", this.emitterNode.name);
          }
          
          for (let i = 0; i < this.data.count; i++) {
             const p = document.createElement('a-sphere');
             p.setAttribute('radius', '0.015');
             p.setAttribute('color', this.data.color);
             p.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.8');
             p.setAttribute('visible', 'false');
             this.el.sceneEl.appendChild(p);
             this.particles.push({
               el: p,
               active: false,
               life: 0,
               pos: new (window as any).THREE.Vector3(),
               vel: new (window as any).THREE.Vector3()
             });
          }
        });
      },
      tick: function (time: number, dt: number) {
        if (!this.emitterNode) return;
        
        const wp = new (window as any).THREE.Vector3();
        this.emitterNode.getWorldPosition(wp);
        
        // Utilizar la posición local del empty respecto al personaje
        const localPos = this.el.object3D.worldToLocal(wp.clone());
        
        if (localPos.y < this.minY) this.minY = localPos.y;
        if (localPos.y > this.maxY) this.maxY = localPos.y;
        
        const rangeY = this.maxY - this.minY;
        let isPouring = false;
        
        // Si el empty se mueve al menos 2cm en el eje Y local, consideramos que está animado
        if (rangeY > 0.02) {
          // Asumimos que riega cuando la punta de la regadera está en la mitad inferior de su rango
          isPouring = localPos.y < (this.maxY - rangeY * 0.4);
        } else if (rangeY !== 0 && time > 3000) {
          // Si han pasado 3s y el rango es ínfimo, quizás la animación no mueve el empty en Y.
          // Fallback: emitir siempre
          isPouring = true;
        }
        
        if (isPouring && Math.random() < 0.8) {
          const p = this.particles.find((p: any) => !p.active);
          if (p) {
            p.active = true;
            p.life = 0.8;
            p.pos.copy(wp);
            // Pequeña dispersión para que el agua parezca salir en chorro
            p.pos.x += (Math.random() - 0.5) * 0.04;
            p.pos.y += (Math.random() - 0.5) * 0.04;
            p.pos.z += (Math.random() - 0.5) * 0.04;
            p.vel.set((Math.random() - 0.5) * 0.4, -1.2 - Math.random() * 0.6, (Math.random() - 0.5) * 0.4);
          }
        }
        
        this.particles.forEach((p: any) => {
           if (p.active) {
             p.life -= dt / 1000;
             p.vel.y -= 2.0 * (dt / 1000); // gravedad
             p.pos.addScaledVector(p.vel, dt / 1000);
             
             const mesh = p.el.getObject3D('mesh');
             if (mesh) {
               mesh.position.copy(p.pos);
               if (mesh.material) {
                 const opacity = Math.max(0, p.life / 0.8 * 0.8);
                 mesh.material.opacity = opacity;
               }
             }
             
             if (!p.wasVisible) {
               p.el.setAttribute('visible', 'true');
               p.wasVisible = true;
             }
             
             if (p.life <= 0 || p.pos.y <= 0) { 
               p.active = false;
               p.wasVisible = false;
               p.el.setAttribute('visible', 'false');
             }
           }
        });
      }
    });
  }

  // Componente para abrir modales al hacer click
  if (!(window as any).AFRAME.components['open-modal']) {
    (window as any).AFRAME.registerComponent('open-modal', {
      schema: { type: 'string', default: '' },
      init: function () {
        this.onClick = () => {
          if (this.data && (window as any).openModal) {
            (window as any).openModal(this.data);
          }
        };
        this.el.addEventListener('click', this.onClick);
      },
      remove: function () {
        this.el.removeEventListener('click', this.onClick);
      }
    });
  }

  // Componente para abrir enlaces al hacer click
  if (!(window as any).AFRAME.components['open-link']) {
    (window as any).AFRAME.registerComponent('open-link', {
      schema: { type: 'string', default: '' },
      init: function () {
        this.onClick = () => {
          if (this.data) {
            if (this.data.startsWith('mailto:')) {
               window.location.href = this.data;
            } else {
               window.open(this.data, '_blank');
            }
          }
        };
        this.el.addEventListener('click', this.onClick);
      },
      remove: function() {
        this.el.removeEventListener('click', this.onClick);
      }
    });
  }

  // Componente para renderizar texto 2D con cualquier fuente en un Canvas y usarlo como textura
  if (!(window as any).AFRAME.components['canvas-text']) {
    (window as any).AFRAME.registerComponent('canvas-text', {
      schema: {
        value: {type: 'string', default: ''},
        font: {type: 'string', default: 'Chakra Petch'},
        fontSize: {type: 'number', default: 40},
        fontWeight: {type: 'string', default: 'normal'},
        color: {type: 'string', default: '#ffffff'},
        align: {type: 'string', default: 'center'},
        width: {type: 'number', default: 512},
        height: {type: 'number', default: 128},
        worldWidth: {type: 'number', default: 2.0}
      },
      update: function() {
        const draw = () => {
          const canvas = document.createElement('canvas');
          canvas.width = this.data.width;
          canvas.height = this.data.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height); // Fondo transparente
          ctx.fillStyle = this.data.color;
          ctx.font = `${this.data.fontWeight} ${this.data.fontSize}px "${this.data.font}", sans-serif`;
          ctx.textAlign = this.data.align as CanvasTextAlign;
          ctx.textBaseline = 'middle';

          const x = this.data.align === 'center' ? canvas.width / 2 : (this.data.align === 'right' ? canvas.width : 0);
          const y = canvas.height / 2;

          // Procesar saltos de línea explícitos si vienen del JSX como string literal '\n' o '|'
          const textValue = this.data.value.replace(/\\n/g, '\n').replace(/\|/g, '\n');
          const lines = textValue.split('\n');
          const lineHeight = this.data.fontSize * 1.3;
          const startY = y - ((lines.length - 1) * lineHeight) / 2;
          
          lines.forEach((line: string, i: number) => {
              ctx.fillText(line.trim(), x, startY + (i * lineHeight));
          });

          const texture = new (window as any).THREE.CanvasTexture(canvas);
          texture.minFilter = (window as any).THREE.LinearFilter;
          
          const material = new (window as any).THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              depthWrite: false, // Prevents z-fighting flicker with background panels
              side: (window as any).THREE.DoubleSide
          });

          const worldHeight = this.data.worldWidth * (this.data.height / this.data.width);
          const geometry = new (window as any).THREE.PlaneGeometry(this.data.worldWidth, worldHeight);
          const mesh = new (window as any).THREE.Mesh(geometry, material);
          
          this.el.setObject3D('mesh', mesh);
        };

        // Esperar a que las fuentes se carguen para pintar el canvas correctamente
        if (document.fonts) {
          document.fonts.ready.then(draw);
        } else {
          setTimeout(draw, 500);
        }
      }
    });
  }

  // Componente para mover sutilmente el elemento basándose en el ratón
  if (!(window as any).AFRAME.components['mouse-parallax']) {
    (window as any).AFRAME.registerComponent('mouse-parallax', {
      schema: {
        factorX: {type: 'number', default: 0.15},
        factorY: {type: 'number', default: 0.15}
      },
      init: function () {
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        this.onMouseMove = (e: MouseEvent) => {
          // Normalizar coordenadas a rango -1 a 1
          this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
          this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', this.onMouseMove);
      },
      tick: function () {
        // Guarda la posición inicial como referencia en el primer frame
        if (!this.initialPos) {
          const pos = this.el.getAttribute('position');
          this.initialPos = pos ? Object.assign({}, pos) : {x:0, y:0, z:0};
        }
        
        // Interpolación (easing) para suavizar
        this.targetX += (this.mouseX - this.targetX) * 0.05;
        this.targetY += (this.mouseY - this.targetY) * 0.05;

        // Mueve sutilmente sumando a la posición base
        this.el.object3D.position.set(
          this.initialPos.x + this.targetX * this.data.factorX,
          this.initialPos.y + this.targetY * this.data.factorY,
          this.initialPos.z
        );
      },
      remove: function () {
        window.removeEventListener('mousemove', this.onMouseMove);
      }
    });
  }
  // Componente para manejar rotación con rueda de ratón en el pivote
  if (!(window as any).AFRAME.components['carousel-scroll']) {
    (window as any).AFRAME.registerComponent('carousel-scroll', {
      schema: {
        speed: { type: 'number', default: 0.1 }
      },
      init: function () {
        this.targetRotation = 0;
        this.currentRotation = 0;
        this.isScrolling = false;
        
        this.cameraRig = document.querySelector('#camera-rig');

        this.onWheel = (e: WheelEvent) => {
          if (this.isScrolling) return;
          if (Math.abs(e.deltaY) < 10) return; // ignore small trackpad events
          
          this.isScrolling = true;
          // Bloqueo de desplazamiento durante 800ms para evitar sobre-rotación
          setTimeout(() => { this.isScrolling = false; }, 800);
          
          // Increment the target rotation by multiples of 90 degrees based on scroll direction
          this.targetRotation += Math.sign(e.deltaY) * 90; 
        };
        window.addEventListener('wheel', this.onWheel);
      },
      tick: function () {
        // Smooth interpolation
        this.currentRotation += (this.targetRotation - this.currentRotation) * 0.05;
        this.el.object3D.rotation.y = (window as any).THREE.MathUtils.degToRad(this.currentRotation);
        
        // Exponer el ángulo actual para los paneles dinámicos
        (this.el as any).currentCarouselAngle = this.currentRotation;
        
        // Notify React
        const normalizedAngle = ((this.currentRotation % 360) + 360) % 360;
        if (Math.abs((this.lastNotifiedAngle || 0) - normalizedAngle) > 0.5) {
          window.dispatchEvent(new CustomEvent('carousel-angle-changed', { detail: normalizedAngle }));
          this.lastNotifiedAngle = normalizedAngle;
        }

        if (this.cameraRig) {
          // Normalizamos la rotación destino a un rango [0, 360)
          const normalized = ((this.targetRotation % 360) + 360) % 360;
          
          let targetZ = 3.5;
          // 90 y 270 corresponden a la isla de stack técnico y la de proyectos
          if (normalized === 90 || normalized === 270) {
            targetZ = 6.0; // Alejar la cámara para que se vea todo
          } else if (normalized === 180) {
            targetZ = 4.5; // Alejar un pelín en la isla de skills
          }

          const currentPosZ = this.cameraRig.object3D.position.z;
          const newZ = currentPosZ + (targetZ - currentPosZ) * 0.05;
          this.cameraRig.object3D.position.z = newZ;
        }
      },
      remove: function () {
        window.removeEventListener('wheel', this.onWheel);
      }
    });
  }

  // Componentes para máscara (efecto pantalla de tv)
  if (!(window as any).AFRAME.components['stencil-mask']) {
    (window as any).AFRAME.registerComponent('stencil-mask', {
      init: function () {
        this.applyStencil = () => {
          const mesh = this.el.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node: any) => {
              if (node.isMesh && node.material) {
                node.material.colorWrite = false;
                node.material.depthWrite = false;
                node.renderOrder = 10;
                node.material.stencilWrite = true;
                node.material.stencilRef = 1;
                node.material.stencilFunc = (window as any).THREE.AlwaysStencilFunc;
                node.material.stencilZPass = (window as any).THREE.ReplaceStencilOp;
              }
            });
          }
        };
        this.el.addEventListener('object3dset', this.applyStencil);
        setTimeout(this.applyStencil, 50);
      }
    });
  }

  if (!(window as any).AFRAME.components['stencil-content']) {
    (window as any).AFRAME.registerComponent('stencil-content', {
      init: function () {
        this.applyStencil = () => {
          const mesh = this.el.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node: any) => {
              if (node.isMesh && node.material) {
                node.renderOrder = 11;
                node.material.stencilWrite = true;
                node.material.stencilRef = 1;
                node.material.stencilFunc = (window as any).THREE.EqualStencilFunc;
              }
            });
          }
        };
        this.el.addEventListener('object3dset', this.applyStencil);
        setTimeout(this.applyStencil, 50);
      }
    });
  }

  // Componente para el carrusel de videos
  if (!(window as any).AFRAME.components['video-carousel']) {
    (window as any).AFRAME.registerComponent('video-carousel', {
      schema: {
        index: { type: 'number', default: 0 },
        interval: { type: 'number', default: 5000 }
      },
      init: function () {
        this.items = Array.from(this.el.querySelectorAll('.carousel-item'));
        this.prevBtn = this.el.querySelector('.carousel-prev');
        this.nextBtn = this.el.querySelector('.carousel-next');

        this.items.forEach((item: any, i: number) => {
          if (i === this.data.index) {
            item.setAttribute('visible', 'true');
            item.setAttribute('position', '0 0 0');
          } else {
            item.setAttribute('visible', 'false');
            item.setAttribute('position', '3 0 0');
          }

          const videoEl = item.querySelector('a-video');
          if (videoEl) {
            const src = videoEl.getAttribute('src');
            if (src) {
               const vid = document.querySelector(src) as HTMLVideoElement;
               if (vid) {
                 if (i === this.data.index) {
                   const playFromMiddle = () => {
                     if (!isNaN(vid.duration) && vid.duration > 0) {
                       vid.currentTime = vid.duration / 2;
                     }
                     vid.playbackRate = 1.3;
                     vid.play().catch(() => {});
                   };
                   if (vid.readyState >= 1) {
                     playFromMiddle();
                   } else {
                     vid.addEventListener('loadedmetadata', playFromMiddle, { once: true });
                   }
                 } else {
                   vid.pause();
                 }
               }
            }
          }
        });

        this.updateView = (oldIndex: number, direction: number) => {
          this.items.forEach((item: any, i: number) => {
            item.removeAttribute('animation__slide');
            
            if (i === this.data.index) {
              item.setAttribute('visible', 'true');
              const startX = direction >  0 ? 3 : -3;
              item.setAttribute('animation__slide', `property: position; from: ${startX} 0 0; to: 0 0 0; dur: 800; easing: easeInOutCubic`);
            } else if (i === oldIndex) {
              const endX = direction >  0 ? -3 : 3;
              item.setAttribute('animation__slide', `property: position; from: 0 0 0; to: ${endX} 0 0; dur: 800; easing: easeInOutCubic`);
              setTimeout(() => {
                if (this.data.index !== i) {
                  item.setAttribute('visible', 'false');
                }
              }, 800);
            } else {
              item.setAttribute('visible', 'false');
            }

            const videoEl = item.querySelector('a-video');
            if (videoEl) {
              const src = videoEl.getAttribute('src');
              if (src) {
                 const vid = document.querySelector(src) as HTMLVideoElement;
                 if (vid) {
                   if (i === this.data.index) {
                     const playFromMiddle = () => {
                       if (!isNaN(vid.duration) && vid.duration > 0) {
                         vid.currentTime = vid.duration / 2;
                       }
                       vid.playbackRate = 1.3;
                       vid.play().catch(() => {});
                     };
                     if (vid.readyState >= 1) {
                       playFromMiddle();
                     } else {
                       vid.addEventListener('loadedmetadata', playFromMiddle, { once: true });
                     }
                   } else {
                     vid.pause();
                   }
                 }
              }
            }
          });
        };

        this.next = () => {
          const oldIndex = this.data.index;
          this.data.index = (this.data.index + 1) % this.items.length;
          this.updateView(oldIndex, 1);
        };

        this.prev = () => {
          const oldIndex = this.data.index;
          this.data.index = (this.data.index - 1 + this.items.length) % this.items.length;
          this.updateView(oldIndex, -1);
        };

        if (this.prevBtn) {
          this.prevBtn.addEventListener('click', () => {
            this.resetAutoPlay();
            this.prev();
          });
        }
        
        if (this.nextBtn) {
          this.nextBtn.addEventListener('click', () => {
            this.resetAutoPlay();
            this.next();
          });
        }

        this.startAutoPlay();
      },
      startAutoPlay: function() {
        this.intervalId = setInterval(() => {
          this.next();
        }, this.data.interval);
      },
      resetAutoPlay: function() {
        clearInterval(this.intervalId);
        this.startAutoPlay();
      },
      remove: function() {
        clearInterval(this.intervalId);
      }
    });
  }

  // Componente para transición de opacidad del avatar en las islas
  if (!(window as any).AFRAME.components['dynamic-avatar']) {
    (window as any).AFRAME.registerComponent('dynamic-avatar', {
      schema: {
        activeAngle: { type: 'number', default: 0 },
        tolerance: { type: 'number', default: 60 }
      },
      init: function () {
        this.pivot = document.querySelector('#islands-pivot');
        this.currentOpacity = 0; // Starts at 0, tick will fade it in if active
        // Flag to check if model is actually parsed and meshes are ready
        this.modelReady = false;
        
        this.el.addEventListener('model-loaded', () => {
          this.modelReady = true;
          this.cachedMaterials = [];
          // Pre-configurar los materiales para ser transparentes una sola vez
          const mesh = this.el.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node: any) => {
              if (node.isMesh && node.material) {
                node.material.transparent = true;
                node.material.needsUpdate = true;
                this.cachedMaterials.push(node.material);
              }
            });
          }
          this.applyOpacity(this.currentOpacity);
        });
      },
      applyOpacity: function (opacity: number) {
        if (this.cachedMaterials) {
          for(let i=0; i<this.cachedMaterials.length; i++) {
             this.cachedMaterials[i].opacity = opacity;
          }
        }
      },
      tick: function () {
        if (!this.pivot || (this.pivot as any).currentCarouselAngle === undefined || !this.modelReady) return;
        
        const currentPivotAngle = (this.pivot as any).currentCarouselAngle;
        let diff = (currentPivotAngle - this.data.activeAngle) % 360;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        const targetOpacity = Math.abs(diff) < this.data.tolerance ? 
          (1 - (Math.abs(diff) / this.data.tolerance)) : 0;
          
        if (Math.abs(this.currentOpacity - targetOpacity) > 0.01) {
          this.currentOpacity += (targetOpacity - this.currentOpacity) * 0.1;
          this.applyOpacity(this.currentOpacity);
        }
      }
    });
  }

  // Shader para aura brillante
  if (!(window as any).AFRAME.shaders['glow-aura']) {
    (window as any).AFRAME.registerShader('glow-aura', {
      schema: {
        color: {type: 'color', is: 'uniform', default: '#a16ae8'},
        opacity: {type: 'number', is: 'uniform', default: 0.8}
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 color;
        uniform float opacity;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          float alpha = (1.0 - (dist * 2.0)) * opacity;
          if (alpha < 0.0) alpha = 0.0;
          gl_FragColor = vec4(color, alpha);
        }
      `
    });
  }

  // Componente para paneles de información dinámicos basados en la rotación del carrusel
  if (!(window as any).AFRAME.components['dynamic-island-panel']) {
    (window as any).AFRAME.registerComponent('dynamic-island-panel', {
      schema: {
        activeAngle: { type: 'number', default: 0 },
        tolerance: { type: 'number', default: 60 },
        lineStart: { type: 'string', default: '0 0.8 0' },
        lineColor: { type: 'string', default: '#a16ae8' }
      },
      init: function () {
        this.pivot = document.querySelector('#islands-pivot') as any;
        this.cameraRig = document.querySelector('#camera-rig') as any;
        this.currentOpacity = -1;

        setTimeout(() => {
          this.els = {
            container: this.el.querySelector('.panel-container'),
            bg: this.el.querySelector('.panel-bg'),
            border: this.el.querySelector('.panel-border'),
            line: this.el.querySelector('.panel-line'),
            textEls: this.el.querySelectorAll('[canvas-text]'),
            images: this.el.querySelectorAll('a-image')
          };
          // Forzar visibilidad inicial oculta
          this.el.setAttribute('visible', 'false');
        }, 100);
      },
      tick: function () {
        if (!this.pivot || !this.els || !this.els.container || (this.pivot as any).currentCarouselAngle === undefined) return;
        
        const currentPivotAngle = (this.pivot as any).currentCarouselAngle;
        
        // Normalizar diferencia para manejar ángulos > 360 o < -360
        let diff = (currentPivotAngle - this.data.activeAngle) % 360;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        // Calcular desvanecimiento con ease
        let t = 1.0 - (Math.abs(diff) / this.data.tolerance);
        t = Math.max(0, Math.min(1, t));
        const targetOpacity = t * t * (3 - 2 * t);
        
        // Avoid executing updates if nothing changed
        // Also skip applying if it's invisible and the camera moved
        if (Math.abs(this.currentOpacity - targetOpacity) < 0.001) {
           const isStationary = targetOpacity === 0 || targetOpacity >= 0.999;
           if (isStationary && this.els.lastAngle === currentPivotAngle) {
              return;
           }
        }
        
        this.els.lastAngle = currentPivotAngle;
        
        // Orientación dinámica y línea cuando el panel es visible
        if (this.cameraRig && t > 0.01) {
          const THREE = (window as any).THREE;
          const cameraPos = new THREE.Vector3();
          this.cameraRig.object3D.getWorldPosition(cameraPos);
          // Aproximar altura de los ojos en la cámara (dependiendo de la plataforma XR puede oscilar entre Y=0 y Y=1.6)
          cameraPos.y += 1.6;
          
          // El panel siempre mira hacia la cámara rig (y no a su centro local, lo que da el efecto 'siempre de frente')
          this.els.container.object3D.lookAt(cameraPos);
          
          if (this.els.line) {
            const pWidth = 2.4; // Cached assumption for speed instead of getAttribute
            const hw = pWidth / 2;
            const leftCorner = new THREE.Vector3(-hw, -0.55, 0);
            const rightCorner = new THREE.Vector3(hw, -0.55, 0);
            
            // Pasar a World Space con su nueva rotación de cámara
            this.els.container.object3D.localToWorld(leftCorner);
            this.els.container.object3D.localToWorld(rightCorner);
            
            // Determinar si el panel está a la izquierda o derecha en coordenadas globales
            const worldPos = new THREE.Vector3();
            this.els.container.object3D.getWorldPosition(worldPos);
            const isLeftPlacement = worldPos.x < 0;
            
            // Pasar de vuelta al espacio Local del this.el padre (donde está dibujada la a-entity línea)
            this.el.object3D.worldToLocal(leftCorner);
            this.el.object3D.worldToLocal(rightCorner);
            
            // Dependiendo de su lado visual global, conectar con la esquina interior (más cerca del centro)
            const targetCorner = isLeftPlacement ? rightCorner : leftCorner;
            
            this.els.line.setAttribute('line', {
               start: this.data.lineStart,
               end: `${targetCorner.x} ${targetCorner.y} ${targetCorner.z}`,
               color: this.data.lineColor,
               opacity: targetOpacity * 0.8 
            });
          }
        }
        
        if (Math.abs(this.currentOpacity - targetOpacity) < 0.001) return;
        this.currentOpacity = targetOpacity;
        
        if (this.els.bg) {
          const mesh = this.els.bg.getObject3D('mesh');
          if (mesh && mesh.material) { mesh.material.opacity = targetOpacity * 0.6; mesh.material.transparent = true; }
        }
        if (this.els.border) {
          const mesh = this.els.border.getObject3D('mesh');
          if (mesh && mesh.material) { mesh.material.opacity = targetOpacity * 0.8; mesh.material.transparent = true; }
        }
        if (this.els.textEls) {
          this.els.textEls.forEach((txtEl: any) => {
            const mesh = txtEl.getObject3D('mesh');
            if (mesh && mesh.material) {
              mesh.material.opacity = targetOpacity;
              mesh.material.transparent = true;
            }
          });
        }
        if (this.els.images) {
          this.els.images.forEach((imgEl: any) => {
            const mesh = imgEl.getObject3D('mesh');
            if (mesh && mesh.material) {
              mesh.material.opacity = targetOpacity;
              mesh.material.transparent = true;
            }
          });
        }
        
        if (targetOpacity <= 0.01) {
           if (this.el.getAttribute('visible')) this.el.setAttribute('visible', 'false');
        } else {
           if (!this.el.getAttribute('visible')) this.el.setAttribute('visible', 'true');
        }
      }
    });
  }

  // Componente para base brillante o particulas manuales, útil para placeholders o imágenes
  if (!(window as any).AFRAME.components['glowing-particles']) {
    (window as any).AFRAME.registerComponent('glowing-particles', {
      schema: {
        color: { type: 'color', default: '#a16ae8' },
        intensity: { type: 'number', default: 2.0 },
        radius: { type: 'number', default: 0.5 },
        yOffset: { type: 'number', default: 0.05 } // Altura base (ej. a nivel del suelo)
      },
      init: function () {
        const radius = this.data.radius;
        const localCenter = { x: 0, y: this.data.yOffset, z: 0 };
        
        const light = document.createElement('a-light');
        light.setAttribute('type', 'point');
        light.setAttribute('color', this.data.color);
        light.setAttribute('intensity', this.data.intensity.toString());
        light.setAttribute('distance', (radius * 8).toString()); 
        light.setAttribute('position', `${localCenter.x} ${localCenter.y + 0.3} ${localCenter.z}`); 
        
        this.el.appendChild(light);

        // Pequeñas partículas moradas que se mueven lentamente
        for (let i = 0; i < 3; i++) {
          const particle = document.createElement('a-octahedron');
          const pRadius = Math.random() * 0.02 + 0.01;
          particle.setAttribute('radius', pRadius.toString());
          particle.setAttribute('color', this.data.color);
          particle.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.8');
          
          const startAngle = Math.random() * Math.PI * 2;
          const dist = Math.random() * radius * 0.8;
          const sx = localCenter.x + Math.cos(startAngle) * dist;
          const sz = localCenter.z + Math.sin(startAngle) * dist;
          const sy = localCenter.y + Math.random() * 0.2;
          
          particle.setAttribute('position', `${sx} ${sy} ${sz}`);
          
          const endY = sy + 0.5 + Math.random() * 0.8;
          const dx = sx + (Math.random() - 0.5) * 0.4;
          const dz = sz + (Math.random() - 0.5) * 0.4;
          const dur = 4000 + Math.random() * 3000;
          
          particle.setAttribute('animation__opacity', `property: material.opacity; from: 0.1; to: 0.9; dur: ${dur/2}; dir: alternate; loop: true; easing: easeInOutSine`);
          
          this.el.appendChild(particle);
        }
      }
    });
  }

  // Componente para bases brillantes estáticas (Hard/Soft Skills)
  if (!(window as any).AFRAME.components['glowing-base']) {
    (window as any).AFRAME.registerComponent('glowing-base', {
      schema: {
        color: { type: 'color', default: '#a16ae8' },
        intensity: { type: 'number', default: 2.0 },
        radiusOffset: { type: 'number', default: 0.1 },
        yOffset: { type: 'number', default: 0.05 }
      },
      init: function () {
        this.el.addEventListener('model-loaded', () => {
          const obj = this.el.getObject3D('mesh');
          if (!obj) return;
          
          if (this.el.sceneEl && this.el.sceneEl.object3D) {
            this.el.sceneEl.object3D.updateMatrixWorld(true);
          }
          
          const box = new (window as any).THREE.Box3().setFromObject(obj);
          
          const worldCenter = new (window as any).THREE.Vector3();
          box.getCenter(worldCenter);
          
          const size = new (window as any).THREE.Vector3();
          box.getSize(size);
          
          const localCenter = this.el.object3D.worldToLocal(worldCenter.clone());
          
          const worldMinBox = new (window as any).THREE.Vector3(worldCenter.x, box.min.y, worldCenter.z);
          const localMinBox = this.el.object3D.worldToLocal(worldMinBox.clone());

          const radius = (Math.max(size.x, size.z) / 2) + this.data.radiusOffset;
          
          const light = document.createElement('a-light');
          light.setAttribute('type', 'point');
          light.setAttribute('color', this.data.color);
          light.setAttribute('intensity', this.data.intensity.toString());
          light.setAttribute('distance', (radius * 8).toString()); // Aumentamos la distancia para que ilumine más área
          light.setAttribute('position', `${localCenter.x} ${localMinBox.y + 0.3} ${localCenter.z}`); // Ligeramente más cerca de la base
          
          this.el.appendChild(light);

          // Pequeñas partículas moradas que se mueven lentamente
          for (let i = 0; i < 3; i++) {
            const particle = document.createElement('a-octahedron');
            const pRadius = Math.random() * 0.02 + 0.01;
            particle.setAttribute('radius', pRadius.toString());
            particle.setAttribute('color', this.data.color);
            particle.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.8');
            
            const startAngle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius * 0.8;
            const sx = localCenter.x + Math.cos(startAngle) * dist;
            const sz = localCenter.z + Math.sin(startAngle) * dist;
            const sy = localMinBox.y + Math.random() * 0.2;
            
            particle.setAttribute('position', `${sx} ${sy} ${sz}`);
            
            const endY = sy + 0.5 + Math.random() * 0.8;
            const dx = sx + (Math.random() - 0.5) * 0.4;
            const dz = sz + (Math.random() - 0.5) * 0.4;
            const dur = 4000 + Math.random() * 3000;
            
            particle.setAttribute('animation__opacity', `property: material.opacity; from: 0.1; to: 0.9; dur: ${dur/2}; dir: alternate; loop: true; easing: easeInOutSine`);
            
            this.el.appendChild(particle);
          }
        });
      }
    });
  }

  // Componente para cascada de partículas (Agua que cae)
  if (!(window as any).AFRAME.components['waterfall-particles']) {
    (window as any).AFRAME.registerComponent('waterfall-particles', {
      schema: {
        color: { type: 'color', default: '#3a86ff' },
        countPerEmpty: { type: 'number', default: 5 },
        spreadX: { type: 'number', default: 0.8 },
        spreadZ: { type: 'number', default: 0.2 }
      },
      init: function () {
        this.emitters = [];

        this.el.addEventListener('model-loaded', () => {
          const obj = this.el.getObject3D('mesh');
          if (!obj) return;
          
          if (this.el.sceneEl && this.el.sceneEl.object3D) {
            this.el.sceneEl.object3D.updateMatrixWorld(true);
          }

          obj.traverse((node: any) => {
            // A veces Blender exporta como Empty, Locator, etc. 
            // Buscaremos cualquier nodo que contenga 'water', 'particle', 'palce' o 'empty'
            const nodeName = node.name.toLowerCase();
            if (nodeName && (nodeName.includes('water') || nodeName.includes('particle') || nodeName.includes('palce') || nodeName.includes('empty'))) {
              const wp = new (window as any).THREE.Vector3();
              node.getWorldPosition(wp);
              
              // Convertir la posición global a la posición local de este a-entity
              const localPos = this.el.object3D.worldToLocal(wp.clone());
              this.emitters.push(localPos);
            }
          });
          
          // Fallback por si los emptys no se exportaron correctamente en el glTF
          if (this.emitters.length === 0) {
            console.warn("No se detectaron nodos 'Empty' para la cascada. Usando fallback pos");
            // Posiciones aproximadas de cascadas
            this.emitters.push(new (window as any).THREE.Vector3(0.1, 0, 1.0));
            this.emitters.push(new (window as any).THREE.Vector3(-0.3, 0, 1.1));
          }

          this.emitters.forEach((emitterPos: any) => {
              for(let i=0; i<this.data.countPerEmpty; i++) {
                 this.createParticle(emitterPos);
              }
              // Añadir pequeña nube en la posición de los emptys
              this.createCloud(emitterPos);
          });
        });
      },
      createCloud: function(emitterPos: any) {
          const cloud = document.createElement('a-entity');
          // Nube formada por 3 o 4 esferas blancas superpuestas
          const spherePositions = [
              { x: 0, y: 0, z: 0, r: 0.15 },
              { x: 0.25, y: -0.04, z: 0, r: 0.14 },
              { x: -0.25, y: -0.04, z: 0, r: 0.14 },
              { x: 0.5, y: -0.08, z: 0, r: 0.1 },
              { x: -0.5, y: -0.08, z: 0, r: 0.1 },
              { x: 0.12, y: 0.05, z: 0, r: 0.12 },
              { x: -0.12, y: 0.04, z: 0, r: 0.11 }
          ];
          
          spherePositions.forEach(sp => {
              const s = document.createElement('a-octahedron');
              s.setAttribute('position', `${sp.x} ${sp.y} ${sp.z}`);
              s.setAttribute('radius', sp.r.toString());
              s.setAttribute('color', '#ffffff');
              s.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.9');
              cloud.appendChild(s);
          });
          
          // Posicionar la nube usando la posición del empty.
          cloud.setAttribute('position', `${emitterPos.x} ${emitterPos.y} ${emitterPos.z}`);
          // Animación suave de balanceo/flotación
          cloud.setAttribute('animation', `property: position; to: ${emitterPos.x} ${emitterPos.y + 0.05} ${emitterPos.z}; dir: alternate; dur: 2000; loop: true; easing: easeInOutSine`);
          
          this.el.appendChild(cloud);
      },
      createParticle: function(emitterPos: any) {
          const particle = document.createElement('a-box');
          const radius = 0.01 + Math.random() * 0.015;
          const height = 0.1 + Math.random() * 0.2;
          particle.setAttribute('width', (radius*2).toString()); particle.setAttribute('depth', (radius*2).toString());
          particle.setAttribute('height', height.toString());
          particle.setAttribute('color', this.data.color);
          particle.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.8');
          
          this.el.appendChild(particle);
          this.animateParticle(particle, emitterPos);
      },
      animateParticle: function(particle: any, emitterPos: any) {
          const rx = (Math.random() - 0.5) * this.data.spreadX;
          const rz = (Math.random() - 0.5) * this.data.spreadZ;
          
          const startX = emitterPos.x + rx;
          const startY = emitterPos.y;
          const startZ = emitterPos.z + rz;
          
          particle.setAttribute('position', `${startX} ${startY} ${startZ}`);
          particle.setAttribute('scale', '1 1 1');
          
          particle.removeAttribute('animation__pos');
          particle.removeAttribute('animation__scale');
          particle.removeAttribute('animation__opacity');
          
          const dropDist = 1.5 + Math.random() * 1.5;
          const dur = 600 + Math.random() * 400; // Más rápido para simular caída
          
          setTimeout(() => {
              if (!particle.parentNode) return;
              
              // easeInCubic simula aceleración por gravedad
              particle.setAttribute('animation__pos', `property: position; to: ${startX} ${startY - dropDist} ${startZ}; dur: ${dur}; easing: easeInCubic`);
              particle.setAttribute('animation__scale', `property: scale; to: 0.2 1.5 0.2; dur: ${dur}; easing: easeInQuad`);
              particle.setAttribute('animation__opacity', `property: material.opacity; from: 0.9; to: 0; dur: ${dur * 0.7}; delay: ${dur * 0.3}; easing: easeOutQuad`);
              
              setTimeout(() => {
                  if (particle.parentNode) {
                      this.animateParticle(particle, emitterPos);
                  }
              }, dur + 50);
          }, Math.random() * 800);
      }
    });
  }

}

const VideoPlayer = ({ src, isActive }: { src: string; isActive: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isActive) {
      if (videoRef.current) {
        // Reproducir automáticamente y con volumen si es posible
        videoRef.current.play().catch(() => {});
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#050505', backgroundImage: 'radial-gradient(circle, #4b3b73 0%, #050505 80%)' }}>
      <video
        ref={videoRef}
        src={src}
        controls
        muted={true}
        playsInline={true}
        style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1, backgroundColor: 'transparent' }}
      />
    </div>
  );
};

const calculateAge = () => {
  const birthDate = new Date(2006, 8, 27); // 27 Septiembre 2006
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function App() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [programLogos, setProgramLogos] = useState<string[]>([]);
  const [carouselAngle, setCarouselAngle] = useState(0);
  const appRef = useRef<HTMLDivElement>(null);

  const getOpacityForAngle = (targetAngle: number) => {
    let diff = (carouselAngle - targetAngle) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const tolerance = 45;
    let t = 1.0 - (Math.abs(diff) / tolerance);
    return Math.max(0, Math.min(1, t));
  };
  
  const mainIslandOpacity = getOpacityForAngle(0);

  useEffect(() => {
    const handleAngle = (e: any) => setCarouselAngle(e.detail);
    window.addEventListener('carousel-angle-changed', handleAngle);
    return () => window.removeEventListener('carousel-angle-changed', handleAngle);
  }, []);

  useEffect(() => {
    (window as any).openModal = setActiveModal;
    return () => { delete (window as any).openModal; };
  }, []);

  useEffect(() => {
    // Usamos una lista estática para evitar límites de la API de GitHub
    setProgramLogos([
      "https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/programas-logos/Adobe_After_Effects_logo.png",
      "https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/programas-logos/Adobe_Photoshop_logo.png",
      "https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/programas-logos/Adobe_Premiere_Pro_logo.png",
      "https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/programas-logos/GeminiLogo.png",
      "https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/programas-logos/Logo_Blender.png",
      "https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/programas-logos/Unity_Technologies_logo.png",
      "https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/programas-logos/aframe-logo.jpg",
      "https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/programas-logos/davinci-resolve-logo.webp"
    ]);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      appRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const menuItems = [
    { id: 'sobre-mi', label: 'Sobre mi' },
    { id: 'skills', label: 'Skills' },
    { id: 'proyectos', label: 'Proyectos' },
  ];

  const projectsData: { title: ReactNode; text: ReactNode; image: ReactNode | ((isActive: boolean) => ReactNode); }[] = [
    {
      title: <b>Okiru: Trabajo de Fin de Grado</b>,
      text: (
        <>
          Animación de personaje con entorno, modelado, texturizado y riggeado en <b>Blender</b>. Montaje de video y etalonaje realizados con <b>Adobe After Effects</b> y <b>DaVinci Resolve</b>. Trabajo de <b>6 meses</b> para un proyecto de fin de grado de Animación 3D, Videojuegos y Entornos interactivos en <b>Cesur</b>.
        </>
      ),
      image: (isActive) => <VideoPlayer src={"https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Proyectosporfolio/TFG_Video-Final%20-%20Compressed%20with%20FlexClip.mp4"} isActive={isActive} />
    },
    {
      title: <b>Personajes e Ilustraciones: Video Showcase</b>,
      text: (
        <>
          Ilustraciones realizadas en diversos programas de diseño como <b>Adobe Photoshop, ClipStudio Paint y Medibang Paint</b>. El montaje de video y las animaciones están hechas en <b>Adobe After Effects</b>. Video realizado en <b>1 semana</b> a modo de porfolio para mostrar mis capacidades de diseño de personaje y habilidades de dibujo.
        </>
      ),
      image: (isActive) => <VideoPlayer src={"https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Proyectosporfolio/Aitana_Garcia_Portfolio%20-%20Compressed%20with%20FlexClip.mp4"} isActive={isActive} />
    },
    {
      title: <b>DoCatFlow: Proyecto en equipo para Educa 360</b>,
      text: (
        <>
          En un tiempo de <b>1 mes</b>, mi equipo y yo tuvimos que desarrollar este proyecto con una tecnología que no conocíamos y finalmente acabamos aprendiéndola y sacando adelante DoCatFlow. El proyecto está desarrollado con el framework <b>A-Frame</b> con la tecnología integrada <b>HTML</b> y la ayuda de <b>Google AI Studio (Gemini)</b>. En DoCatFlow, yo me dedique a modelar, texturizar, riggear y animar los gatos en <b>Blender</b> y sus respectivos accesorios. El resto del equipo se dedico a hacer las habitaciones y los muebles. Luego, entre todo el equipo nos dedicamos a montar en la escena A-Frame cada habitación.
        </>
      ),
      image: (isActive) => <VideoPlayer src={"https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Proyectosporfolio/DoCatFlow_Proyecto_.mov"} isActive={isActive} />
    }
  ];

  const modalContent: Record<string, { title: string; text: ReactNode }> = {
    'sobre-mi': {
      title: 'Sobre mi',
      text: (
        <>
          <b>Artista 3D/2D | Graduada en Animación 3D, Juegos y Entornos Interactivos (Cesur)</b>
          <br /><br />
          Especializada en el diseño y modelado de elementos 3D y 2D. Me centro sobre todo en el desarrollo de personajes y assets para el entretenimiento digital y videojuegos.
          <br />
          Mi experiencia en prácticas duales en <b>MakkingOf</b> y <b>Educa360</b> me ayudó a ver cómo es el día a día en un equipo real. Ahora busco entrar a un estudio para aportar calidad, adaptabilidad y buena base técnica.
          <br /><br />
          Este portafolio está construido con el framework A-Frame, con la asistencia de Google AI Studio. Combina una escena 3D interactiva con tecnología HTML.
          <br /><br />
          <b>¡Contáctame!</b>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" style={{ width: '20px', height: '20px' }} />
              <a href="mailto:aitanagarciagarcia.contacto@gmail.com" style={{ fontSize: '0.95em', color: 'inherit', textDecoration: 'underline', pointerEvents: 'auto', cursor: 'pointer' }}>aitanagarciagarcia.contacto@gmail.com</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
              <a href="https://www.linkedin.com/in/aitana-garc%C3%ADa-garc%C3%ADa-88313b167/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.95em', color: 'inherit', textDecoration: 'underline', pointerEvents: 'auto', cursor: 'pointer' }}>/in/aitana-garcía-garcía</a>
            </div>
          </div>
        </>
      ),
    },
    'skills': {
      title: 'Skills',
      text: (
        <>
          <b style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>Soft Skills</b>
          <ul className="list-none space-y-4 mt-2 mb-8">
            <li className="flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/1-SoftSkillLogo.png" alt="Soft Skill 1" style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ alignSelf: 'center', fontSize: '18px' }}>Buena asimilación y aplicación de Feedback Constructivo.</span>
            </li>
            <li className="flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/2-SoftSkillLogo.png" alt="Soft Skill 2" style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ alignSelf: 'center', fontSize: '18px' }}>Gestionar mi tiempo para cumplir con las fechas de entrega y adaptarme al ritmo de trabajo del equipo.</span>
            </li>
            <li className="flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/3-SoftSkillLogo.png" alt="Soft Skill 3" style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ alignSelf: 'center', fontSize: '18px' }}>Iniciativa para investigar y solucionar problemas técnicos.</span>
            </li>
            <li className="flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/4-SoftSkillLogo.png" alt="Soft Skill 4" style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ alignSelf: 'center', fontSize: '18px' }}>Facilidad para adaptarme al estilo visual del proyecto.</span>
            </li>
            <li className="flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/5-SoftSkillLogo.png" alt="Soft Skill 5" style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ alignSelf: 'center', fontSize: '18px' }}>Capacidad para aprender nuevos procesos de trabajo y adaptarme rápido a la forma de producir del equipo.</span>
            </li>
          </ul>

          <b style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>Hard Skills</b>
          <ul className="list-none space-y-4 mt-2">
            <li className="flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/1-HardSkillLogo.png" alt="Hard Skill 1" style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ alignSelf: 'center', fontSize: '18px' }}>Modelado en 3D asegurándome de que las mallas tengan una topología limpia y optimizada para producción.</span>
            </li>
            <li className="flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/2-HardSkillLogo.png" alt="Hard Skill 2" style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ alignSelf: 'center', fontSize: '18px' }}>Crear ciclos de movimiento donde las físicas, los impactos y la transferencia de peso se sientan naturales.</span>
            </li>
            <li className="flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/3-HardSkillLogo.png" alt="Hard Skill 3" style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ alignSelf: 'center', fontSize: '18px' }}>Pasar las ideas del texto al dibujo, organizando la narrativa visual y la acción de cada plano.</span>
            </li>
            <li className="flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/4-HardSkillLogo.png" alt="Hard Skill 4" style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ alignSelf: 'center', fontSize: '18px' }}>Creación de rigs y pesado de mallas en Blender.</span>
            </li>
            <li className="flex items-start gap-4">
              <img src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/5-HardSkillLogo.png" alt="Hard Skill 5" style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ alignSelf: 'center', fontSize: '18px' }}>Capacidad de uso de IA generativa para prototipado rápido, ideación y aceleración de las fases de producción.</span>
            </li>
          </ul>
        </>
      ),
    },
    'proyectos': {
      title: 'Proyectos',
      text: '(texto placeholder)',
    }
  };

  return (
    <div ref={appRef} style={{ height: '100vh', width: '100vw', backgroundColor: '#c5d7ff', position: 'relative', overflow: 'hidden' }}>
      
      {/* BOTÓN FULLSCREEN PERSONALIZADO */}
      <button
        onClick={toggleFullscreen}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: '#a16ae8',
          color: '#ffeefc',
          border: '2px solid #ff4ecf',
          borderRadius: 0,
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s',
          zIndex: 50,
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isFullscreen ? 'Salir de Fullscreen' : 'Fullscreen'}
      </button>

      {/* MENÚ SUPERIOR IZQUIERDO */}
      <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          display: 'flex',
          gap: '15px',
          zIndex: 40
        }}
      >
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveModal(item.id)}
            style={{
              padding: '18px 36px',
              backgroundColor: '#a16ae8',
              color: '#ffeefc',
              border: '2px solid #ff4ecf',
              borderRadius: 0,
              fontFamily: "'Chakra Petch', sans-serif",
              fontSize: '28px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s, filter 0.2s',
              filter: activeModal && activeModal !== item.id ? 'opacity(0.6)' : 'none',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* MODAL (OVERLAY) */}
      {activeModal && (
        <div 
          onWheel={(e) => e.nativeEvent.stopPropagation()}
          style={{
          position: 'absolute',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(75, 59, 115, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 30,
        }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {activeModal === 'proyectos' && (
              <button
                className="pulse-arrow"
                onClick={() => setCurrentProjectIndex((prev) => (prev > 0 ? prev - 1 : projectsData.length - 1))}
                style={{
                  position: 'absolute', left: '-70px', top: '50%',
                  background: 'transparent', border: 'none', color: '#ff4ecf', fontSize: '60px',
                  cursor: 'pointer', zIndex: 40,
                }}
              >
                ◄
              </button>
            )}
            
            <div style={{
              display: 'flex',
            backgroundColor: '#8a6ed1',
            border: '4px solid #ff4ecf',
            borderRadius: 0,
            width: activeModal === 'proyectos' ? '1100px' : (activeModal === 'sobre-mi' || activeModal === 'skills') ? '1000px' : '650px',
            maxWidth: '95%',
            height: activeModal === 'proyectos' ? '750px' : (activeModal === 'sobre-mi' || activeModal === 'skills') ? '650px' : '320px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}>
            {activeModal === 'proyectos' ? (
              <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }} onWheel={(e) => e.nativeEvent.stopPropagation()}>
                <div style={{
                  width: '100%', height: '480px', flexShrink: 0,
                  backgroundColor: '#4b3b73',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  borderBottom: '4px solid #ff4ecf',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    transform: `translateX(-${currentProjectIndex * 100}%)`
                  }}>
                    {projectsData.map((project, index) => (
                      <div key={index} style={{
                        width: '100%', height: '100%', flexShrink: 0,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        padding: '20px'
                      }}>
                        <div style={{
                          height: '100%', backgroundColor: '#c5d7ff', borderRadius: 0,
                          display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#4b3b73',
                          fontFamily: "'Chakra Petch', sans-serif", fontWeight: 'bold', fontSize: '24px',
                          boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.2)',
                          textAlign: 'center', aspectRatio: '16/9', maxWidth: '100%'
                        }}>
                          {typeof project.image === 'function' ? project.image(activeModal === 'proyectos' && currentProjectIndex === index) : project.image}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ position: 'relative', width: '100%', overflow: 'hidden', flexGrow: 1 }}>
                  <div style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    transform: `translateX(-${currentProjectIndex * 100}%)`
                  }}>
                    {projectsData.map((project, index) => (
                      <div key={index} style={{
                        width: '100%', flexShrink: 0,
                        padding: '20px', color: '#e4def7'
                      }}>
                        <h2 style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '28px', color: '#ffeefc', marginBottom: '10px', marginTop: 0 }}>
                          {project.title}
                        </h2>
                        <p style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '18px', lineHeight: '1.6', margin: 0 }}>
                          {project.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  width: '40%',
                  backgroundColor: '#4b3b73',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRight: '4px solid #ff4ecf'
                }}>
                  <div style={{
                    width: '75%', height: '75%', backgroundColor: '#c5d7ff', borderRadius: 0,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#4b3b73',
                    fontFamily: "'Chakra Petch', sans-serif", fontWeight: 'bold',
                    boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.2)',
                    textAlign: 'center',
                    padding: '10px'
                  }}>
                    {activeModal === 'sobre-mi' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/images/Perfil.jfif" alt="Perfil" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 0}} />
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '16px', textAlign: 'center' }}>
                          Aitana García García<br />{calculateAge()} años
                        </div>
                      </div>
                    ) : activeModal === 'skills' ? (
                      <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '15px', width: '100%', height: '100%', overflowY: 'auto', padding: '10px' }}>
                        {programLogos.length > 0 ? programLogos.map((url, i) => (
                           <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                             <img src={url} alt={`Logo ${i}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                           </div>
                        )) : (
                          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#4b3b73' }}>Cargando logos...</div>
                        )}
                      </div>
                    ) : (
                      '[Placeholder de Imagen]'
                    )}
                  </div>
                </div>
                <div className="custom-scrollbar" style={{
                  width: '60%',
                  padding: '40px',
                  paddingRight: '20px',
                  color: '#e4def7',
                  overflowY: 'auto'
                }}
                onWheel={(e) => e.nativeEvent.stopPropagation()}
                >
                  <h2 style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '32px', color: '#ffeefc', marginBottom: '15px', marginTop: 0 }}>
                    {modalContent[activeModal]?.title}
                  </h2>
                  <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '18px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {modalContent[activeModal]?.text}
                  </div>
                </div>
              </>
            )}
          </div>
          {activeModal === 'proyectos' && (
            <button
              className="pulse-arrow"
              onClick={() => setCurrentProjectIndex((prev) => (prev < projectsData.length - 1 ? prev + 1 : 0))}
              style={{
                position: 'absolute', right: '-70px', top: '50%',
                background: 'transparent', border: 'none', color: '#ff4ecf', fontSize: '60px',
                cursor: 'pointer', zIndex: 40,
              }}
            >
              ►
            </button>
          )}
          </div>
          
          <button 
            onClick={() => setActiveModal(null)}
            style={{
              marginTop: '40px',
              backgroundColor: '#ff4ecf', border: 'none', color: '#ffeefc',
              fontSize: '36px', fontWeight: 'bold', cursor: 'pointer',
              padding: '24px 60px', borderRadius: 0,
              fontFamily: "'Chakra Petch', sans-serif",
              transition: 'transform 0.2s, background-color 0.2s, box-shadow 0.2s',
              zIndex: 50,
              boxShadow: '0 0 20px #ff4ecf, 0 4px 8px rgba(0,0,0,0.4)',
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 0 30px #ff76df, 0 6px 12px rgba(0,0,0,0.5)';
              e.currentTarget.style.backgroundColor = '#ff76df';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 20px #ff4ecf, 0 4px 8px rgba(0,0,0,0.4)';
              e.currentTarget.style.backgroundColor = '#ff4ecf';
            }}
          >
            ¡Visita mis islas!
          </button>
        </div>
      )}

      {/* CONTENEDOR DIFUMINABLE PARA LA ESCENA 3D Y HUD INFERIOR */}
      <div style={{ width: '100%', height: '100%', pointerEvents: activeModal ? 'none' : 'auto', filter: activeModal ? 'blur(6px)' : 'none', transition: 'filter 0.3s ease-in-out' }}>
      
      {/* HUD: Texto de instrucción para rotar el carrusel */}
      <div 
        style={{
          position: 'absolute',
          top: '40px',
          left: '0',
          width: '100%',
          textAlign: 'center',
          color: '#ffffff',
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: '28px',
          fontWeight: '700',
          zIndex: 10,
          pointerEvents: 'none', // Para que no bloquee los clics en la escena 3D
          textShadow: '0px 2px 8px rgba(0,0,0,0.3)',
          animation: 'pulseText 2s infinite ease-in-out'
        }}
      >
        ¡Mueve la rueda del ratón!
      </div>

      {/* HUD INFERIOR: Información de Aitana (Isla Principal) */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '1200px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          zIndex: 10,
          pointerEvents: 'none',
          opacity: mainIslandOpacity,
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        {/* Parte Izquierda: Nombre y Título */}
        <div style={{
          backgroundColor: '#ad81e8',
          border: '6px solid #ff4ecf',
          padding: '20px 40px',
          textAlign: 'center',
          pointerEvents: 'auto'
        }}>
          <h1 style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '36px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 5px 0', letterSpacing: '2px' }}>Aitana García</h1>
          <h2 style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '24px', color: '#e4def7', margin: 0, letterSpacing: '1px' }}>Artista 3D/2D</h2>
        </div>

        {/* Parte Derecha: Descripción */}
        <div style={{
          backgroundColor: '#ad81e8',
          border: '6px solid #ff4ecf',
          padding: '20px 40px',
          maxWidth: '500px',
          textAlign: 'center',
          pointerEvents: 'auto'
        }}>
          <p style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '20px', color: '#ffffff', margin: 0, lineHeight: '1.5', letterSpacing: '1px' }}>
            Me apasiona el entorno 3D y 2D.<br />
            Me centro en el diseño y modelado<br />
            de personajes y assets optimizados<br />
            para videojuegos y animación.
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes pulseText {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        @keyframes pulseArrow {
          0% { transform: translateY(-50%) scale(1); filter: drop-shadow(0 0 5px rgba(255, 78, 207, 0.5)); }
          50% { transform: translateY(-50%) scale(1.15); filter: drop-shadow(0 0 15px rgba(255, 78, 207, 1)); }
          100% { transform: translateY(-50%) scale(1); filter: drop-shadow(0 0 5px rgba(255, 78, 207, 0.5)); }
        }
        .pulse-arrow {
          animation: pulseArrow 2s infinite ease-in-out;
          transition: transform 0.1s ease-in-out, filter 0.1s ease-in-out;
        }
        .pulse-arrow:hover {
          animation: none;
          transform: translateY(-50%) scale(1.25);
          filter: drop-shadow(0 0 20px rgba(255, 78, 207, 1));
        }
        .pulse-arrow:active {
          animation: none;
          transform: translateY(-50%) scale(0.85);
          filter: drop-shadow(0 0 10px rgba(255, 78, 207, 0.8));
        }
        .a-enter-vr {
          display: none !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #4b3b73;
          border-radius: 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #ff4ecf;
          border-radius: 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #ff76df;
        }
      `}</style>

      {/* @ts-ignore-next-line A-Frame custom elements aren't natively typed in React */}
      <a-scene vr-mode-ui="enabled: false" renderer="stencil: true; colorManagement: true;" background="color: #c5d7ff">

        {/* @ts-ignore-next-line */}
        <a-assets>
          <video id="vid1" src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Proyectosporfolio/TFG_Video-Final%20-%20Compressed%20with%20FlexClip.mp4" crossOrigin="anonymous" playsInline webkit-playsinline loop muted={true} autoPlay={true}></video>
          <video id="vid2" src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Proyectosporfolio/Aitana_Garcia_Portfolio%20-%20Compressed%20with%20FlexClip.mp4" crossOrigin="anonymous" playsInline webkit-playsinline loop muted={true} autoPlay={true}></video>
          <video id="vid3" src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Proyectosporfolio/DoCatFlow_Proyecto_.mov" crossOrigin="anonymous" playsInline webkit-playsinline loop muted={true} autoPlay={true}></video>
        </a-assets>

        {/* 
          ==================================================
          ENTORNO Y ATMÓSFERA (ENVIRONMENT)
        ==================================================
        */}
        {/* @ts-ignore-next-line a-entity is a custom element */}
        <a-entity environment="skyType: gradient; skyColor: #e4def7; horizonColor: #c5d7ff; shadow: false; ground: none; dressingAmount: 0; lighting: none;" />

        {/* 
          ==================================================
          ILUMINACIÓN DINÁMICA Y NATURAL (ESTÉTICA ANIME SUTIL)
          ==================================================
        */}
        {/* Luz ambiente: sombras exteriores suaves pero con colores más vivos, matiz lavanda azulado alegre */}
        {/* @ts-ignore-next-line */}
        <a-light type="ambient" color="#b8c5ff" intensity="1.0"></a-light>

        {/* Luz direccional principal (Sol): luz de día soleado muy alegre y brillante, saturando los colores de la escena */}
        {/* @ts-ignore-next-line */}
        <a-light type="directional" color="#fffae6" intensity="1.9" position="-5 8 5"></a-light>

        {/* Luz de relleno/rebote: un verde más puro y primaveral vibrante que complementa al morado */}
        {/* @ts-ignore-next-line */}
        <a-light type="directional" color="#4efa8e" intensity="0.8" position="4 3 -5"></a-light>

        {/* Luz puntual etérea: un morado más saturado y vibrante que envuelve el centro con alegría */}
        {/* @ts-ignore-next-line */}
        <a-entity position="0 1.5 0" animation="property: position; to: 0.5 2.2 0.5; dir: alternate; dur: 5000; loop: true; easing: easeInOutSine">
          {/* @ts-ignore-next-line */}
          <a-light type="point" color="#d355ff" intensity="1.6" distance="7"></a-light>
        </a-entity>

        {/*
          ==================================================
          CÁMARA Y CURSOR DE INTERACCIÓN
          ==================================================
          ¡Cámara fija! Ajustada para estar más cerca y con un ángulo 
          menos pronunciado.
        */}
        {/* @ts-ignore-next-line */}
        <a-entity id="camera-rig" position="0 -0.2 3.5" rotation="-5 0 0">
          {/* @ts-ignore-next-line */}
          <a-entity mouse-parallax="factorX: 0.15; factorY: 0.15">
            {/* @ts-ignore-next-line */}
            <a-camera look-controls="enabled: false" wasd-controls="enabled: false">
              {/* @ts-ignore-next-line */}
              <a-entity cursor="rayOrigin: mouse" raycaster="objects: .interactable"></a-entity>
            </a-camera>
          </a-entity>
        </a-entity>

        {/*
          ==========================================        {/*
          ==================================================
          CARRUSEL (PIVOTE DE ROTACIÓN PARA ISLAS)
          ==================================================
        */}
        <a-entity id="islands-pivot" position="0 0 -2.5" carousel-scroll>
          {/*
            ==================================================
            ISLA 1: PRESENTACIÓN (PRINCIPAL)
            ==================================================
          */}
          {/* @ts-ignore-next-line Contenedor principal de la isla (flote) */}
          <a-entity position="0 0 2.5" animation="property: position; to: 0 0.1 2.5; dir: alternate; dur: 3500; loop: true; easing: easeInOutSine">
            
            {/* @ts-ignore-next-line Modelo 3D de la base */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Island_Standard.glb)"
              position="0 0 0"
              scale="1 1 1"
             
            ></a-entity>

            {/* 
              ==================================================
              PERSONAJE, TECLADO Y PANTALLA (ISLA 1: PRESENTACIÓN)
              ==================================================
              Importamos los modelos desde el repositorio de GitHub.
              Se les añade 'animation-mixer' por si tienen animaciones cocinadas (horneadas) en Blender.
            */}
            {/* @ts-ignore-next-line Modelo 3D del personaje */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Character.glb)"
              position="0 0 0"
              animation-mixer="clip: *; loop: repeat"
             
              dynamic-avatar="activeAngle: 0"
            ></a-entity>

            {/* @ts-ignore-next-line Modelo 3D del teclado */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Keyboard.glb)"
              position="0 0 0"
              animation-mixer="clip: *; loop: repeat"
             
              hologram-material=""
            ></a-entity>

            {/* @ts-ignore-next-line Modelo 3D de la pantalla */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Screen.glb)"
              position="0 0 0"
              animation-mixer="clip: *; loop: repeat"
              animation="property: position; to: 0 0.05 0; dir: alternate; dur: 2500; loop: true; easing: easeInOutSine"
             
              hologram-material=""
            ></a-entity>

            {/* 4 Lavandas decorativas alrededor del personaje */}
            {/* @ts-ignore-next-line */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)"
              animation-mixer="clip: *; loop: repeat"
              position="0.8 0 0.6"
              rotation="0 45 0"
              scale="0.3 0.3 0.3"
             
            ></a-entity>
            {/* @ts-ignore-next-line */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)"
              animation-mixer="clip: *; loop: repeat"
              position="-0.7 0 0.5"
              rotation="0 -30 0"
              scale="0.35 0.35 0.35"
             
            ></a-entity>
            {/* @ts-ignore-next-line */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)"
              animation-mixer="clip: *; loop: repeat"
              position="0.6 0 -0.5"
              rotation="0 150 0"
              scale="0.25 0.25 0.25"
             
            ></a-entity>
            {/* @ts-ignore-next-line */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)"
              animation-mixer="clip: *; loop: repeat"
              position="-0.8 0 -0.6"
              rotation="0 -115 0"
              scale="0.4 0.4 0.4"
             
            ></a-entity>

            {/* 
              ==================================================
              CÉSPED LOW POLY DISPERSO (ANIMADO CON EL VIENTO)
              ==================================================
              Grupos de briznas ligeramente más altas y esparcidas 
              por la superficie de la isla, con animaciones de ondeo.
            */}
            {/* @ts-ignore-next-line Contenedor general del césped */}
            <a-entity position="0 0.1 0">
              {/* GRUPO 1: Frente izquierda */}
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.8 0 0.6">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -4 0 -2; to: 12 0 8; dir: alternate; dur: 1800; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.075 0" radius-bottom="0.025" radius-top="0" height="0.15" color="#566d54"></a-cone>
                </a-entity>
                {/* @ts-ignore-next-line */}
                <a-entity position="0.03 0 -0.02" rotation="0 45 0" animation="property: rotation; from: -2 45 -3; to: 10 45 14; dir: alternate; dur: 2200; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.05 0" radius-bottom="0.015" radius-top="0" height="0.1" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* GRUPO 2: Derecha cerca del borde */}
              {/* @ts-ignore-next-line */}
              <a-entity position="0.9 0 0.2">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -5 0 -4; to: 11 0 7; dir: alternate; dur: 2400; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.1 0" radius-bottom="0.03" radius-top="0" height="0.2" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* GRUPO 3: Atrás izquierda, más metido */}
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.5 0 -0.8">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -3 0 6; to: 14 0 -5; dir: alternate; dur: 2000; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.09 0" radius-bottom="0.028" radius-top="0" height="0.18" color="#566d54"></a-cone>
                </a-entity>
                {/* @ts-ignore-next-line */}
                <a-entity position="-0.04 0 0.03" rotation="0 -30 0" animation="property: rotation; from: -4 -30 2; to: 12 -30 -6; dir: alternate; dur: 2300; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.06 0" radius-bottom="0.02" radius-top="0" height="0.12" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* GRUPO 4: Atrás derecha */}
              {/* @ts-ignore-next-line */}
              <a-entity position="0.6 0 -0.5">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -6 0 -5; to: 8 0 13; dir: alternate; dur: 2600; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.07 0" radius-bottom="0.02" radius-top="0" height="0.14" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* GRUPO 5: Centro descentrado */}
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.2 0 0.1">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -3 0 -4; to: 10 0 11; dir: alternate; dur: 1800; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.08 0" radius-bottom="0.025" radius-top="0" height="0.16" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* GRUPO 6: Frente media derecha */}
              {/* @ts-ignore-next-line */}
              <a-entity position="0.4 0 0.7">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -5 0 9; to: 13 0 -4; dir: alternate; dur: 2200; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.06 0" radius-bottom="0.02" radius-top="0" height="0.12" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* NUEVOS GRUPOS */}
              
              {/* GRUPO 7: Extremo Izquierdo */}
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.95 0 -0.2">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -12 0 6; to: 8 0 -5; dir: alternate; dur: 2300; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.07 0" radius-bottom="0.022" radius-top="0" height="0.14" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* GRUPO 8: Frente Centro-Izquierda */}
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.3 0 0.9">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -6 0 -10; to: 14 0 8; dir: alternate; dur: 2500; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.08 0" radius-bottom="0.025" radius-top="0" height="0.16" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* GRUPO 9: Atrás Centro */}
              {/* @ts-ignore-next-line */}
              <a-entity position="0.1 0 -0.9">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -14 0 5; to: 9 0 -6; dir: alternate; dur: 2100; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.09 0" radius-bottom="0.028" radius-top="0" height="0.18" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* GRUPO 10: Medio Derecha Atrás */}
              {/* @ts-ignore-next-line */}
              <a-entity position="0.85 0 -0.3">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -7 0 -12; to: 11 0 9; dir: alternate; dur: 2400; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.06 0" radius-bottom="0.02" radius-top="0" height="0.12" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>
            </a-entity>

            {/* PANEL DE INFORMACIÓN HOLOGRÁFICO 2: ICONOS IZQUIERDA (ISLA 1) */}
            {/* @ts-ignore-next-line */}
            <a-entity dynamic-island-panel="activeAngle: 0">
              {/* @ts-ignore-next-line Panel contenedor */}
              <a-entity class="panel-container" position="-1.0 1.25 0">
                  {/* Recuadro de texto */}
                  {/* @ts-ignore-next-line */}
                  <a-plane class="panel-bg" width="1.5" height="0.2" position="0 0.3 0" color="#a16ae8" material="shader: flat; transparent: true; opacity: 0; side: double"></a-plane>
                  {/* @ts-ignore-next-line */}
                  <a-plane class="panel-border" width="1.55" height="0.25" position="0 0.3 -0.01" color="#ff4ecf" material="shader: flat; transparent: true; opacity: 0; side: double"></a-plane>                  
                  {/* @ts-ignore-next-line */}
                  <a-entity canvas-text="value: hazles click para contactarme; font: Chakra Petch; fontSize: 60; width: 1024; height: 100; worldWidth: 1.4; color: #ffffff; align: center" position="0 0.3 0.04"></a-entity>

                  {/* Logos flotando */}
                  {/* @ts-ignore-next-line */}
                  <a-entity position="0 -0.25 0.04" animation="property: position; to: 0 -0.2 0.04; dir: alternate; dur: 2000; loop: true; easing: easeInOutSine">
                    <a-plane material="shader: glow-aura; color: #ca8dfd; opacity: 1.0; transparent: true; depthWrite: false; blending: additive" width="0.75" height="0.75" position="0 0 -0.01"></a-plane>
                    <a-image class="interactable" open-link="mailto:aitanagarciagarcia.contacto@gmail.com" src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/images/Gmail_icon.png" position="0 0 0" scale="0.5 0.5 1" material="shader: flat; transparent: true; alphaTest: 0.5" animation__mouseenter="property: scale; to: 0.55 0.55 1; dur: 200; easing: easeOutQuad; startEvents: mouseenter" animation__mouseleave="property: scale; to: 0.5 0.5 1; dur: 200; easing: easeOutQuad; startEvents: mouseleave"></a-image>
                  </a-entity>
                  
                  {/* @ts-ignore-next-line */}
                  <a-entity position="0 -0.9 0.04" animation="property: position; to: 0 -0.85 0.04; dir: alternate; dur: 2000; loop: true; easing: easeInOutSine; delay: 500">
                    <a-plane material="shader: glow-aura; color: #ca8dfd; opacity: 1.0; transparent: true; depthWrite: false; blending: additive" width="0.75" height="0.75" position="0 0 -0.01"></a-plane>
                    <a-image class="interactable" open-link="https://www.linkedin.com/in/aitana-garcía-garcía-88313b167" src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/images/LinkedIn_logo.png" position="0 0 0" scale="0.5 0.5 1" material="shader: flat; transparent: true; alphaTest: 0.5" animation__mouseenter="property: scale; to: 0.55 0.55 1; dur: 200; easing: easeOutQuad; startEvents: mouseenter" animation__mouseleave="property: scale; to: 0.5 0.5 1; dur: 200; easing: easeOutQuad; startEvents: mouseleave"></a-image>
                  </a-entity>
              </a-entity>
            </a-entity>



          </a-entity>

          {/*
            ==================================================
            ISLA 3: TECNOLOGÍAS (A LA IZQUIERDA)
            ==================================================
          */}
          {/* @ts-ignore-next-line Contenedor principal de la isla */}
          <a-entity position="-4.5 0.25 0" rotation="0 90 0" animation="property: position; to: -4.5 0.35 0; dir: alternate; dur: 3600; loop: true; easing: easeInOutSine">
            
            {/* @ts-ignore-next-line Modelo 3D de la base */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Island_Standard.glb)"
              position="0 0 0"
              scale="1 1 1"
             
            ></a-entity>

            {/* Avatar Thinking (ISLA 3) */}
            {/* @ts-ignore-next-line Modelo 3D del personaje */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Character_Thinking_Anim.glb)"
              position="-0.9 0.05 -0.6"
              rotation="0 55 0"
              animation-mixer="clip: *; loop: repeat"
             
              dynamic-avatar="activeAngle: 90"
            ></a-entity>

            {/* Modelos del panal y abejas */}
            {/* Base Brillante */}
            {/* @ts-ignore-next-line */}
            <a-entity position="0 0 0" glowing-particles="radius: 0.4"></a-entity>
            
            {/* @ts-ignore-next-line Contenedor general que sube y baja suavemente */}
            <a-entity animation="property: position; to: 0 0.05 0; dir: alternate; dur: 3500; loop: true; easing: easeInOutSine">
              <a-entity look-at-camera>
                {/* @ts-ignore-next-line Panal brillante */}
                <a-entity
                  gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/TechnicalStack_island/Panal_TecnicalStackIsland.glb)"
                  position="0 0.5 0"
                 
                  class="interactable"
                  honeycomb-glow=""
                ></a-entity>

                {/* Abeja 1 animada individualmente */}
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: position; from: 0 0 0; to: 0 0.15 0; dir: alternate; dur: 1800; loop: true; easing: easeInOutSine">
                  <a-entity
                    gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/TechnicalStack_island/Bee-1_TecnicalStackIsland.glb)"
                    position="0 0.5 0"
                   
                    animation-mixer="clip: *; loop: repeat"
                  ></a-entity>
                </a-entity>

                {/* Abeja 2 animada individualmente */}
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: position; from: 0 0 0; to: 0 0.12 0; dir: alternate; dur: 2400; loop: true; easing: easeInOutSine">
                  <a-entity
                    gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/TechnicalStack_island/Bee-2_TecnicalStackIsland.glb)"
                    position="0 0.5 0"
                   
                    animation-mixer="clip: *; loop: repeat"
                  ></a-entity>
                </a-entity>

                {/* Abeja 3 animada individualmente */}
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: position; from: 0 0 0; to: 0 0.2 0; dir: alternate; dur: 2100; loop: true; easing: easeInOutSine">
                  <a-entity
                    gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/TechnicalStack_island/Bee-3_TecnicalStackIsland.glb)"
                    position="0 0.5 0"
                   
                    animation-mixer="clip: *; loop: repeat"
                  ></a-entity>
                </a-entity>
              </a-entity>

              {/* LOGOS FLOTANTES DE LOS PROGRAMAS ORBITANDO */}
              <a-entity animation="property: rotation; to: 0 -360 0; loop: true; dur: 20000; easing: linear">
                {/* Blender */}
                <a-entity rotation="0 0 0">
                  <a-entity position="0 0.25 0.55" look-at-camera>
                    <a-image src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/programas-logos/Logo_Blender.png" width="0.3" height="0.25" material="alphaTest: 0.5"></a-image>
                  </a-entity>
                </a-entity>
                {/* Unity */}
                <a-entity rotation="0 45 0">
                  <a-entity position="0 0.25 0.55" look-at-camera>
                    <a-image src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/programas-logos/Unity_Technologies_logo.png" width="0.3" height="0.3" material="alphaTest: 0.5"></a-image>
                  </a-entity>
                </a-entity>
                {/* DaVinci */}
                <a-entity rotation="0 90 0">
                  <a-entity position="0 0.25 0.55" look-at-camera>
                    <a-image src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/programas-logos/davinci-resolve-logo.webp" width="0.3" height="0.3" material="alphaTest: 0.5"></a-image>
                  </a-entity>
                </a-entity>
                {/* Photoshop */}
                <a-entity rotation="0 135 0">
                  <a-entity position="0 0.25 0.55" look-at-camera>
                    <a-image src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/programas-logos/Adobe_Photoshop_logo.png" width="0.3" height="0.3" material="alphaTest: 0.5"></a-image>
                  </a-entity>
                </a-entity>
                {/* Premiere */}
                <a-entity rotation="0 180 0">
                  <a-entity position="0 0.25 0.55" look-at-camera>
                    <a-image src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/programas-logos/Adobe_Premiere_Pro_logo.png" width="0.3" height="0.3" material="alphaTest: 0.5"></a-image>
                  </a-entity>
                </a-entity>
                {/* IA */}
                <a-entity rotation="0 225 0">
                  <a-entity position="0 0.25 0.55" look-at-camera>
                    <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/programas-logos/GeminiLogo.png" width="0.3" height="0.3" material="alphaTest: 0.5"></a-image>
                  </a-entity>
                </a-entity>
                {/* After Effects */}
                <a-entity rotation="0 270 0">
                  <a-entity position="0 0.25 0.55" look-at-camera>
                    <a-image src="https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/programas-logos/Adobe_After_Effects_logo.png" width="0.3" height="0.3" material="alphaTest: 0.5"></a-image>
                  </a-entity>
                </a-entity>
                {/* A-Frame */}
                <a-entity rotation="0 315 0">
                  <a-entity position="0 0.25 0.55" look-at-camera>
                    <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/programas-logos/aframe-logo.jpg" width="0.3" height="0.3" material="alphaTest: 0.5"></a-image>
                  </a-entity>
                </a-entity>
              </a-entity>
            </a-entity>

            {/* 4 Lavandas decorativas (Copiadas de principal) */}
            {/* @ts-ignore-next-line */}
            <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)" animation-mixer="clip: *; loop: repeat" position="0.8 0 0.6" rotation="0 45 0" scale="0.3 0.3 0.3"></a-entity>
            {/* @ts-ignore-next-line */}
            <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)" animation-mixer="clip: *; loop: repeat" position="-0.7 0 0.5" rotation="0 -30 0" scale="0.35 0.35 0.35"></a-entity>
            {/* @ts-ignore-next-line */}
            <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)" animation-mixer="clip: *; loop: repeat" position="0.6 0 -0.5" rotation="0 150 0" scale="0.25 0.25 0.25"></a-entity>
            {/* @ts-ignore-next-line */}
            <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)" animation-mixer="clip: *; loop: repeat" position="-0.8 0 -0.6" rotation="0 -115 0" scale="0.4 0.4 0.4"></a-entity>

            {/* CÉSPED LOW POLY (Copiado de principal) */}
            {/* @ts-ignore-next-line Contenedor general del césped */}
            <a-entity position="0 0.1 0">
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.8 0 0.6">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -4 0 -2; to: 12 0 8; dir: alternate; dur: 1800; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.075 0" radius-bottom="0.025" radius-top="0" height="0.15" color="#566d54"></a-cone>
                </a-entity>
                {/* @ts-ignore-next-line */}
                <a-entity position="0.03 0 -0.02" rotation="0 45 0" animation="property: rotation; from: -2 45 -3; to: 10 45 14; dir: alternate; dur: 2200; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.05 0" radius-bottom="0.015" radius-top="0" height="0.1" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="0.9 0 0.2">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -5 0 -4; to: 11 0 7; dir: alternate; dur: 2400; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.1 0" radius-bottom="0.03" radius-top="0" height="0.2" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="-0.5 0 -0.8">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -3 0 6; to: 14 0 -5; dir: alternate; dur: 2000; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.09 0" radius-bottom="0.028" radius-top="0" height="0.18" color="#566d54"></a-cone>
                </a-entity>
                {/* @ts-ignore-next-line */}
                <a-entity position="-0.04 0 0.03" rotation="0 -30 0" animation="property: rotation; from: -4 -30 2; to: 12 -30 -6; dir: alternate; dur: 2300; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.06 0" radius-bottom="0.02" radius-top="0" height="0.12" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="0.6 0 -0.5">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -6 0 -5; to: 8 0 13; dir: alternate; dur: 2600; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.07 0" radius-bottom="0.02" radius-top="0" height="0.14" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>
            </a-entity>



          </a-entity>

          {/*
            ==================================================
            ISLA 4: NUEVA TECNOLOGÍA (A LA DERECHA)
            ==================================================
          */}
          {/* @ts-ignore-next-line Contenedor principal de la isla */}
          <a-entity position="4.5 0.25 0" rotation="0 -90 0" animation="property: position; to: 4.5 0.35 0; dir: alternate; dur: 3600; loop: true; easing: easeInOutSine">
            
            {/* @ts-ignore-next-line Modelo 3D de la base */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Island_Standard.glb)"
              position="0 0 0"
              scale="1 1 1"
             
            ></a-entity>

            {/* Avatar Thinking (ISLA 4) */}
            {/* @ts-ignore-next-line Modelo 3D del personaje */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Character_Thinking_Anim.glb)"
              position="0 0.05 0"
              rotation="0 180 0"
              animation-mixer="clip: *; loop: repeat"
             
              dynamic-avatar="activeAngle: -90"
            ></a-entity>

            {/* PLACEHOLDERS DE MARIPOSAS */}
            {/* Base Brillante */}
            {/* @ts-ignore-next-line */}
            <a-entity position="0 0 0" glowing-particles="radius: 0.6"></a-entity>
            
            {/* Mariposa 1 */}
            {/* @ts-ignore-next-line */}
            <a-entity position="-0.5 1.2 0.3" animation="property: position; to: -0.5 1.5 0.3; dir: alternate; dur: 1500; loop: true; easing: easeInOutSine">
              <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@0c870097c9705b358971ac695fa3907b185c0de2/Exports/Butterfly.glb)" animation-mixer="clip: *; loop: repeat" class="interactable" look-at-camera></a-entity>
            </a-entity>

            {/* Mariposa 2 */}
            {/* @ts-ignore-next-line */}
            <a-entity position="0 1.5 -0.2" animation="property: position; to: 0 1.8 -0.2; dir: alternate; dur: 1800; loop: true; easing: easeInOutSine">
              <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@0c870097c9705b358971ac695fa3907b185c0de2/Exports/Butterfly.glb)" animation-mixer="clip: *; loop: repeat" class="interactable" look-at-camera></a-entity>
            </a-entity>

            {/* Mariposa 3 */}
            {/* @ts-ignore-next-line */}
            <a-entity position="0.6 1.0 0.4" animation="property: position; to: 0.6 1.2 0.4; dir: alternate; dur: 1300; loop: true; easing: easeInOutSine">
              <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@0c870097c9705b358971ac695fa3907b185c0de2/Exports/Butterfly.glb)" animation-mixer="clip: *; loop: repeat" class="interactable" look-at-camera></a-entity>
            </a-entity>

            {/* 4 Lavandas decorativas (Copiadas de principal) */}
            {/* @ts-ignore-next-line */}
            <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)" animation-mixer="clip: *; loop: repeat" position="0.8 0 0.6" rotation="0 45 0" scale="0.3 0.3 0.3"></a-entity>
            {/* @ts-ignore-next-line */}
            <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)" animation-mixer="clip: *; loop: repeat" position="-0.7 0 0.5" rotation="0 -30 0" scale="0.35 0.35 0.35"></a-entity>
            {/* @ts-ignore-next-line */}
            <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)" animation-mixer="clip: *; loop: repeat" position="0.6 0 -0.5" rotation="0 150 0" scale="0.25 0.25 0.25"></a-entity>
            {/* @ts-ignore-next-line */}
            <a-entity gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Single_Lavender.glb)" animation-mixer="clip: *; loop: repeat" position="-0.8 0 -0.6" rotation="0 -115 0" scale="0.4 0.4 0.4"></a-entity>

            {/* CÉSPED LOW POLY (Copiado de principal) */}
            {/* @ts-ignore-next-line Contenedor general del césped */}
            <a-entity position="0 0.1 0">
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.8 0 0.6">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -4 0 -2; to: 12 0 8; dir: alternate; dur: 1800; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.075 0" radius-bottom="0.025" radius-top="0" height="0.15" color="#566d54"></a-cone>
                </a-entity>
                {/* @ts-ignore-next-line */}
                <a-entity position="0.03 0 -0.02" rotation="0 45 0" animation="property: rotation; from: -2 45 -3; to: 10 45 14; dir: alternate; dur: 2200; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.05 0" radius-bottom="0.015" radius-top="0" height="0.1" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="0.9 0 0.2">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -5 0 -4; to: 11 0 7; dir: alternate; dur: 2400; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.1 0" radius-bottom="0.03" radius-top="0" height="0.2" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="-0.5 0 -0.8">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -3 0 6; to: 14 0 -5; dir: alternate; dur: 2000; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.09 0" radius-bottom="0.028" radius-top="0" height="0.18" color="#566d54"></a-cone>
                </a-entity>
                {/* @ts-ignore-next-line */}
                <a-entity position="-0.04 0 0.03" rotation="0 -30 0" animation="property: rotation; from: -4 -30 2; to: 12 -30 -6; dir: alternate; dur: 2300; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.06 0" radius-bottom="0.02" radius-top="0" height="0.12" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="0.6 0 -0.5">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -6 0 -5; to: 8 0 13; dir: alternate; dur: 2600; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.07 0" radius-bottom="0.02" radius-top="0" height="0.14" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>
            </a-entity>

            {/* PANEL DE INFORMACIÓN HOLOGRÁFICO (ISLA 4) */}
            {/* @ts-ignore-next-line */}
            <a-entity dynamic-island-panel="activeAngle: -90">
              {/* @ts-ignore-next-line Panel contenedor */}
              <a-entity class="panel-container" position="-2.6 1.8 -0.2" video-carousel>
                  {/* @ts-ignore-next-line */}
                  <a-plane class="panel-bg" width="3.2" height="2.0" color="#a16ae8" material="shader: flat; transparent: true; opacity: 0; side: double"></a-plane>
                  {/* @ts-ignore-next-line */}
                  <a-plane class="panel-border" width="3.25" height="2.05" position="0 0 -0.01" color="#ff4ecf" material="shader: flat; transparent: true; opacity: 0; side: double"></a-plane>
                  
                  {/* Título Principal */}
                  {/* @ts-ignore-next-line */}
                  <a-entity canvas-text="value: Proyectos; font: Chakra Petch; fontWeight: bold; fontSize: 75; width: 1024; height: 128; worldWidth: 3.0; color: #ffffff; align: center" position="0 0.8 0.01"></a-entity>
                  
                  {/* MASCARA DEL VIDEO -> Evita que el contenedor desborde cuando se desliza */}
                  <a-plane stencil-mask width="2.4" height="1.35" position="0 -0.05 0.021" material="transparent: true; opacity: 0; colorWrite: false; side: double"></a-plane>

                  {/* Contenedor de Proyectos */}
                  {/* Proyecto 1 */}
                  {/* @ts-ignore-next-line */}
                  <a-entity class="carousel-item" visible="true">
                    {/* El video */}
                    {/* @ts-ignore-next-line */}
                    <a-video stencil-content src="#vid1" width="1.955" height="1.1" position="0 0.05 0.02"></a-video>
                    {/* @ts-ignore-next-line */}
                    <a-entity stencil-content canvas-text="value: Okiru: Trabajo de Fin de Grado; font: Chakra Petch; fontSize: 45; width: 1024; height: 128; worldWidth: 2.2; color: #ffffff; align: center" position="0 -0.60 0.03"></a-entity>
                  </a-entity>

                  {/* Proyecto 2 */}
                  {/* @ts-ignore-next-line */}
                  <a-entity class="carousel-item" visible="false">
                    {/* El video */}
                    {/* @ts-ignore-next-line */}
                    <a-video stencil-content src="#vid2" width="1.955" height="1.1" position="0 0.05 0.02"></a-video>
                    {/* @ts-ignore-next-line */}
                    <a-entity stencil-content canvas-text="value: Personajes e Ilustraciones: Video Showcase; font: Chakra Petch; fontSize: 40; width: 1024; height: 128; worldWidth: 2.2; color: #ffffff; align: center" position="0 -0.60 0.03"></a-entity>
                  </a-entity>

                  {/* Proyecto 3 */}
                  {/* @ts-ignore-next-line */}
                  <a-entity class="carousel-item" visible="false">
                    {/* El video */}
                    {/* @ts-ignore-next-line */}
                    <a-video stencil-content src="#vid3" width="1.955" height="1.1" position="0 0.05 0.02"></a-video>
                    {/* @ts-ignore-next-line */}
                    <a-entity stencil-content canvas-text="value: DoCatFlow: Proyecto en equipo para Educa 360; font: Chakra Petch; fontSize: 45; width: 1024; height: 128; worldWidth: 2.2; color: #ffffff; align: center" position="0 -0.60 0.03"></a-entity>
                  </a-entity>

                  {/* Botones */}
                  {/* @ts-ignore-next-line Flecha Izquierda */}
                  <a-entity position="-1.4 -0.05 0.05">
                    <a-triangle class="carousel-prev interactable" vertex-a="-0.1 0 0" vertex-b="0.1 0.15 0" vertex-c="0.1 -0.15 0" color="#ff4ecf" material="shader: flat" animation__hover="property: scale; to: 1.2 1.2 1.2; startEvents: mouseenter; dur: 200" animation__leave="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 200"></a-triangle>
                  </a-entity>
                  
                  {/* @ts-ignore-next-line Flecha Derecha */}
                  <a-entity position="1.4 -0.05 0.05">
                    <a-triangle class="carousel-next interactable" vertex-a="0.1 0 0" vertex-b="-0.1 -0.15 0" vertex-c="-0.1 0.15 0" color="#ff4ecf" material="shader: flat" animation__hover="property: scale; to: 1.2 1.2 1.2; startEvents: mouseenter; dur: 200" animation__leave="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 200"></a-triangle>
                  </a-entity>
                  
              </a-entity>
            </a-entity>

          </a-entity>

          {/*
            ==================================================
            ISLA 2: COMPETENCIAS (ATRÁS DE LA PRINCIPAL)
            ==================================================
          */}
          {/* @ts-ignore-next-line Contenedor principal de la isla de competencias */}
          <a-entity position="0 0.5 -2.5" rotation="0 180 0" animation="property: position; to: 0 0.6 -2.5; dir: alternate; dur: 3800; loop: true; easing: easeInOutSine">
            {/* Base de la isla de competencias */}
            {/* @ts-ignore-next-line */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Competence_Island/Competitions_Island.glb)"
              position="0 0 0"
              animation-mixer="clip: *; loop: repeat"
             
              waterfall-particles="color: #6ed3ff; countPerEmpty: 10; spreadX: 0.85; spreadZ: 0.15"
            ></a-entity>

            {/* Avatar Watering (ISLA 2) */}
            {/* @ts-ignore-next-line Modelo 3D del personaje regando */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Character_Watering_Anim.glb)"
              position="-0.6 0.05 -0.1"
              rotation="0 -45 0"
              animation-mixer="clip: *; loop: repeat"
             
              dynamic-avatar="activeAngle: 180"
              watering-particles="color: #6ed3ff"
            ></a-entity>

            {/* Hard Skills */}
            {/* @ts-ignore-next-line */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Competence_Island/HardSkills.glb)"
              position="0 0 0"
              animation-mixer="clip: *; loop: repeat"
             
              glowing-base="color: #a16ae8; radiusOffset: 0.2; yOffset: 0.05"
            ></a-entity>

            {/* Logos flotantes Hard Skills (Derecha) rodeando la piedra */}
            {/* @ts-ignore-next-line */}
            <a-entity position="1.4 0.8 0.2">
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.4 0.8 0.2" animation="property: position; to: -0.4 0.9 0.2; dir: alternate; dur: 2100; loop: true; easing: easeInOutSine">
                <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/1-HardSkillLogo.png" width="0.35" height="0.35" material="shader: flat; transparent: true; alphaTest: 0.5" animation="property: rotation; from: 0 -10 -5; to: 0 10 5; dir: alternate; dur: 2400; loop: true; easing: easeInOutSine"></a-image>
              </a-entity>
              {/* @ts-ignore-next-line */}
              <a-entity position="0 1.2 0" animation="property: position; to: 0 1.3 0; dir: alternate; dur: 2300; loop: true; easing: easeInOutSine">
                <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/2-HardSkillLogo.png" width="0.35" height="0.35" material="shader: flat; transparent: true; alphaTest: 0.5" animation="property: rotation; from: 0 -5 -10; to: 0 5 10; dir: alternate; dur: 2200; loop: true; easing: easeInOutSine"></a-image>
              </a-entity>
              {/* @ts-ignore-next-line */}
              <a-entity position="0.5 0.7 0.3" animation="property: position; to: 0.5 0.8 0.3; dir: alternate; dur: 2500; loop: true; easing: easeInOutSine">
                <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/3-HardSkillLogo.png" width="0.35" height="0.35" material="shader: flat; transparent: true; alphaTest: 0.5" animation="property: rotation; from: 0 -10 5; to: 0 10 -5; dir: alternate; dur: 2600; loop: true; easing: easeInOutSine"></a-image>
              </a-entity>
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.4 0.2 0.5" animation="property: position; to: -0.4 0.3 0.5; dir: alternate; dur: 2000; loop: true; easing: easeInOutSine">
                <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/4-HardSkillLogo.png" width="0.35" height="0.35" material="shader: flat; transparent: true; alphaTest: 0.5" animation="property: rotation; from: 0 -5 5; to: 0 5 -5; dir: alternate; dur: 2150; loop: true; easing: easeInOutSine"></a-image>
              </a-entity>
              {/* @ts-ignore-next-line */}
              <a-entity position="0.4 0.2 0.4" animation="property: position; to: 0.4 0.3 0.4; dir: alternate; dur: 2200; loop: true; easing: easeInOutSine">
                <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/5-HardSkillLogo.png" width="0.35" height="0.35" material="shader: flat; transparent: true; alphaTest: 0.5" animation="property: rotation; from: 0 -8 -8; to: 0 8 8; dir: alternate; dur: 2550; loop: true; easing: easeInOutSine"></a-image>
              </a-entity>
            </a-entity>

            {/* Soft Skills */}
            {/* @ts-ignore-next-line */}
            <a-entity
              gltf-model="url(https://cdn.jsdelivr.net/gh/holalala1010/Porfolio_Educa360@main/Exports/Competence_Island/SoftSkills.glb)"
              position="0 0 0"
              animation-mixer="clip: *; loop: repeat"
             
              glowing-base="color: #a16ae8; radiusOffset: 0.2; yOffset: 0.05"
            ></a-entity>

            {/* Logos flotantes Soft Skills (Izquierda) rodeando las lavandas */}
            {/* @ts-ignore-next-line */}
            <a-entity position="-1.5 0.8 0.1">
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.8 1.4 0.2" animation="property: position; to: -0.8 1.5 0.2; dir: alternate; dur: 2000; loop: true; easing: easeInOutSine">
                <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/1-SoftSkillLogo.png" width="0.4" height="0.4" material="shader: flat; transparent: true; alphaTest: 0.5" animation="property: rotation; from: 0 -10 -5; to: 0 10 5; dir: alternate; dur: 2500; loop: true; easing: easeInOutSine"></a-image>
              </a-entity>
              {/* @ts-ignore-next-line */}
              <a-entity position="0.3 1.2 -0.2" animation="property: position; to: 0.3 1.3 -0.2; dir: alternate; dur: 2200; loop: true; easing: easeInOutSine">
                <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/2-SoftSkillLogo.png" width="0.4" height="0.4" material="shader: flat; transparent: true; alphaTest: 0.5" animation="property: rotation; from: 0 -5 -10; to: 0 5 10; dir: alternate; dur: 2300; loop: true; easing: easeInOutSine"></a-image>
              </a-entity>
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.7 0.4 -0.1" animation="property: position; to: -0.7 0.5 -0.1; dir: alternate; dur: 2400; loop: true; easing: easeInOutSine">
                <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/3-SoftSkillLogo.png" width="0.4" height="0.4" material="shader: flat; transparent: true; alphaTest: 0.5" animation="property: rotation; from: 0 -10 5; to: 0 10 -5; dir: alternate; dur: 2700; loop: true; easing: easeInOutSine"></a-image>
              </a-entity>
              {/* @ts-ignore-next-line */}
              <a-entity position="0.2 0.3 0.3" animation="property: position; to: 0.2 0.4 0.3; dir: alternate; dur: 2100; loop: true; easing: easeInOutSine">
                <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/4-SoftSkillLogo.png" width="0.4" height="0.4" material="shader: flat; transparent: true; alphaTest: 0.5" animation="property: rotation; from: 0 -5 5; to: 0 5 -5; dir: alternate; dur: 2100; loop: true; easing: easeInOutSine"></a-image>
              </a-entity>
              {/* @ts-ignore-next-line */}
              <a-entity position="-1.0 0.9 -0.3" animation="property: position; to: -1.0 1.0 -0.3; dir: alternate; dur: 2300; loop: true; easing: easeInOutSine">
                <a-image src="https://raw.githubusercontent.com/holalala1010/Porfolio_Educa360/main/Soflt-Hard-Skills_LOGOS/5-SoftSkillLogo.png" width="0.4" height="0.4" material="shader: flat; transparent: true; alphaTest: 0.5" animation="property: rotation; from: 0 -8 -8; to: 0 8 8; dir: alternate; dur: 2600; loop: true; easing: easeInOutSine"></a-image>
              </a-entity>
            </a-entity>

            {/* 
              ==================================================
              CÉSPED LOW POLY DISPERSO (ANIMADO CON EL VIENTO) - ISLA 2
              ==================================================
              Ubicado a los lados para evitar el río central.
            */}
            {/* @ts-ignore-next-line Contenedor general del césped */}
            <a-entity position="0 0.1 0">
              {/* LADO IZQUIERDO */}
              {/* @ts-ignore-next-line */}
              <a-entity position="-0.7 0 0.6">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -4 0 -2; to: 12 0 8; dir: alternate; dur: 1800; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.075 0" radius-bottom="0.025" radius-top="0" height="0.15" color="#566d54"></a-cone>
                </a-entity>
                {/* @ts-ignore-next-line */}
                <a-entity position="0.03 0 -0.02" rotation="0 45 0" animation="property: rotation; from: -2 45 -3; to: 10 45 14; dir: alternate; dur: 2200; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.05 0" radius-bottom="0.015" radius-top="0" height="0.1" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="-0.85 0 0.2">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -3 0 6; to: 14 0 -5; dir: alternate; dur: 2000; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.09 0" radius-bottom="0.028" radius-top="0" height="0.18" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="-0.6 0 -0.6">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -6 0 -10; to: 14 0 8; dir: alternate; dur: 2500; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.08 0" radius-bottom="0.025" radius-top="0" height="0.16" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="-0.9 0 -0.3">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -12 0 6; to: 8 0 -5; dir: alternate; dur: 2300; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.07 0" radius-bottom="0.022" radius-top="0" height="0.14" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* LADO DERECHO */}
              {/* @ts-ignore-next-line */}
              <a-entity position="0.8 0 0.4">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -5 0 -4; to: 11 0 7; dir: alternate; dur: 2400; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.1 0" radius-bottom="0.03" radius-top="0" height="0.2" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="0.6 0 -0.7">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -6 0 -5; to: 8 0 13; dir: alternate; dur: 2600; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.07 0" radius-bottom="0.02" radius-top="0" height="0.14" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="0.7 0 0.8">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -5 0 9; to: 13 0 -4; dir: alternate; dur: 2200; loop: true; easing: easeInOutSine">
                  <a-cone segments-radial="4" position="0 0.06 0" radius-bottom="0.02" radius-top="0" height="0.12" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>

              {/* @ts-ignore-next-line */}
              <a-entity position="0.9 0 -0.2">
                {/* @ts-ignore-next-line */}
                <a-entity animation="property: rotation; from: -14 0 5; to: 9 0 -6; dir: alternate; dur: 2100; loop: true; easing: easeInOutQuad">
                  <a-cone segments-radial="4" position="0 0.09 0" radius-bottom="0.028" radius-top="0" height="0.18" color="#566d54"></a-cone>
                </a-entity>
              </a-entity>
            </a-entity>

            {/* PANEL DE INFORMACIÓN HOLOGRÁFICO CENTRAL (ISLA 2) */}
            {/* @ts-ignore-next-line */}
            <a-entity dynamic-island-panel="activeAngle: 180">
              {/* @ts-ignore-next-line Panel contenedor */}
              <a-entity class="panel-container" position="0 1.8 -0.4">
                  {/* @ts-ignore-next-line */}
                  <a-plane class="panel-bg interactable" open-modal="skills" animation__hover="property: scale; from: 1 1 1; to: 1.05 1.05 1.05; startEvents: mouseenter; dur: 200" animation__leave="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 200" width="2.2" height="0.6" color="#a16ae8" material="shader: flat; transparent: true; opacity: 0; side: double"></a-plane>
                  {/* @ts-ignore-next-line */}
                  <a-plane class="panel-border" width="2.25" height="0.65" position="0 0 -0.01" color="#ff4ecf" material="shader: flat; transparent: true; opacity: 0; side: double"></a-plane>
                  {/* @ts-ignore-next-line */}
                  <a-entity canvas-text="value: ¡Clica aqui para|ver mis skills!; font: Chakra Petch; fontSize: 80; width: 1024; height: 260; worldWidth: 2.0; color: #ffffff; align: center" position="0 0.02 0.04"></a-entity>
              </a-entity>
            </a-entity>

          </a-entity>
        </a-entity>

      </a-scene>
      </div>
    </div>
  );
}
