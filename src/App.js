import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

//================================================================================
// THREE.js ASCII Effect
//================================================================================
const AsciiEffect = ( renderer, charSet = ' .:-=+*#%@', options = {} ) => {
    const fCharSet = charSet;
    const bResolution = !options.resolution ? 0.15 : options.resolution; // Reduced resolution for better performance
    const bInvert = !options.invert ? false : options.invert;

    let iWidth, iHeight;
    const iChar_hd = 2;

    const oAscii = document.createElement('div');
    oAscii.style.fontFamily = 'monospace';
    oAscii.style.lineHeight = '1';

    const hiddenCanvas = document.createElement('canvas');
    let hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });

    const domElement = oAscii;

    const setSize = (width, height) => {
        iWidth = width;
        iHeight = height;
        renderer.setSize(width, height);
        hiddenCanvas.width = iWidth;
        hiddenCanvas.height = iHeight;
        hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
        initAscii(width, height);
    };

    const initAscii = (width, height) => {
        oAscii.innerHTML = '';
        const iCellsX = Math.round(bResolution * width);
        const iCellsY = Math.round(bResolution * height / iChar_hd);
        oAscii.style.width = width + 'px';
        oAscii.style.height = height + 'px';
        oAscii.style.color = '#5A768A';
        oAscii.style.backgroundColor = '#D7E7E9';
        oAscii.style.whiteSpace = 'pre';
        oAscii.style.margin = '0px';
        oAscii.style.padding = '0px';
        oAscii.style.letterSpacing = '-0.15em';
        oAscii.style.fontSize = '8px'; // Make font smaller for better detail
        let sTxt = '';
        for (let i = 0; i < iCellsX * iCellsY; i++) {
            sTxt += ' ';
        }
        oAscii.textContent = sTxt;
    };

    const render = (scene, camera) => {
        renderer.render(scene, camera);
        asciifyImage(renderer, oAscii);
    };

    const asciifyImage = (renderer, oAscii) => {
        if (iWidth === 0 || iHeight === 0) return;

        const sChars = fCharSet;
        const iChar_ln = sChars.length - 1;
        hiddenCtx.clearRect(0, 0, iWidth, iHeight);
        hiddenCtx.drawImage(renderer.domElement, 0, 0, iWidth, iHeight);
        let oData;
        try {
            oData = hiddenCtx.getImageData(0, 0, iWidth, iHeight).data;
        } catch (e) {
            return;
        }
        const iCellsX = Math.round(bResolution * iWidth);
        const iCellsY = Math.round(bResolution * iHeight / iChar_hd);
        let sTxt = '';
        const iDeltaX = Math.round(iWidth / iCellsX);
        const iDeltaY = Math.round(iHeight / iCellsY);
        for (let y = 0; y < iCellsY; y++) {
            for (let x = 0; x < iCellsX; x++) {
                const iPosX = x * iDeltaX;
                const iPosY = y * iDeltaY;
                let fLight = 0;
                let iComponent = 0;
                for (let j = 0; j < iDeltaY; j++) {
                    for (let i = 0; i < iDeltaX; i++) {
                        const iDataInd = ((iPosY + j) * iWidth + (iPosX + i)) * 4;
                        const iR = oData[iDataInd];
                        const iG = oData[iDataInd + 1];
                        const iB = oData[iDataInd + 2];
                        fLight += (iR * 0.299 + iG * 0.587 + iB * 0.114);
                        iComponent++;
                    }
                }
                if (iComponent > 0) fLight /= iComponent;
                let iChar_idx = Math.round((bInvert ? fLight : (255 - fLight)) / 255 * iChar_ln);
                sTxt += sChars[iChar_idx] || ' ';
            }
            sTxt += '\n';
        }
        oAscii.textContent = sTxt;
    };

    return { domElement, render, setSize };
};

//================================================================================
// Styles
//================================================================================
const styles = `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        background-color: #D7E7E9;
        color: #5A768A;
        line-height: 1.6;
    }
    
    .container {
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .grid {
        display: grid;
        grid-template-columns: 1fr 2fr;
        min-height: 100vh;
    }
    
    @media (max-width: 768px) {
        .grid {
            grid-template-columns: 1fr;
        }
    }
    
    .navigation {
        padding: 3rem 2rem;
        position: sticky;
        top: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
        background-color: #D7E7E9;
        border-right: 1px solid #C2D7DD;
    }
    
    .logo {
        font-size: 1.25rem;
        font-weight: bold;
        color: #5A768A;
        letter-spacing: 0.1em;
        margin-bottom: auto;
    }
    
    .nav-list {
        list-style: none;
    }
    
    .nav-item {
        margin-bottom: 1rem;
    }
    
    .nav-link {
        font-size: 1.125rem;
        color: #6F90A8;
        text-decoration: none;
        transition: color 0.3s ease;
    }
    
    .nav-link:hover {
        color: #5A768A;
    }
    
    .main-content {
        background-color: #D7E7E9;
    }
    
    .hero-section {
        position: relative;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        padding: 4rem 3rem;
        justify-content: center;
        align-items: flex-start;
    }
    
    .hero-title {
        position: relative;
        z-index: 10;
        font-size: clamp(3rem, 8vw, 6rem);
        font-weight: 800;
        color: #5A768A;
        line-height: 0.9;
        margin-bottom: 2rem;
    }
    
    .ascii-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        max-width: 600px;
        z-index: 5;
    }
    
    .ascii-scene {
        width: 100%;
        aspect-ratio: 16/9;
        max-height: 500px;
        background-color: #D7E7E9;
        border-radius: 8px;
        border: 2px solid #C2D7DD;
        overflow: hidden;
    }
    
    .section {
        min-height: 50vh;
        padding: 4rem 3rem;
        border-top: 1px solid #C2D7DD;
    }
    
    .section-title {
        font-size: clamp(2.5rem, 6vw, 4rem);
        font-weight: bold;
        color: #5A768A;
        margin-bottom: 3rem;
    }
    
    .clients-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 2rem;
        font-size: 1.5rem;
        font-weight: bold;
        color: #6F90A8;
    }
    
    .work-item {
        margin-bottom: 3rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .work-item:hover .work-title {
        color: #5A768A;
    }
    
    .work-item:hover .arrow {
        transform: translateX(8px);
    }
    
    .work-date {
        color: #A3B5C0;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }
    
    .work-title {
        font-size: 1.875rem;
        color: #6F90A8;
        font-weight: 600;
        transition: color 0.3s ease;
    }
    
    .arrow {
        display: inline-block;
        transition: transform 0.3s ease;
    }
    
    .achievements-list {
        margin-bottom: 2rem;
    }
    
    .achievement-category {
        font-size: 1.5rem;
        font-weight: 600;
        color: #6F90A8;
        margin-bottom: 1rem;
    }
    
    .achievement-items {
        list-style: disc;
        list-style-position: inside;
        color: #6F90A8;
    }
    
    .contact-email {
        font-size: clamp(1.5rem, 4vw, 2.5rem);
        color: #6F90A8;
        text-decoration: none;
        transition: color 0.3s ease;
        display: block;
        margin-bottom: 1rem;
    }
    
    .contact-email:hover {
        color: #5A768A;
    }
    
    .contact-note {
        color: #A3B5C0;
        margin-bottom: 2rem;
    }
    
    .social-list {
        list-style: none;
    }
    
    .social-link {
        color: #6F90A8;
        text-decoration: none;
        transition: color 0.3s ease;
    }
    
    .social-link:hover {
        color: #5A768A;
    }
    
    .footer {
        text-align: center;
        padding: 2rem;
        color: #A3B5C0;
        font-size: 0.875rem;
        border-top: 1px solid #C2D7DD;
    }
`;

//================================================================================
// React Components
//================================================================================
const AsciiArtScene = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        let camera, scene, renderer, effect;
        let phoneGroup;
        let animationFrameId;
        let isInitialized = false;
        
        const start = Date.now();

        const init = (width, height) => {
            if (isInitialized) return;
            isInitialized = true;

            camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
            camera.position.set(0, 200, 300); // Moved camera closer

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0, 0, 0);

            const pointLight1 = new THREE.PointLight(0xffffff, 6, 0, 0);
            pointLight1.position.set(400, 400, 400);
            scene.add(pointLight1);

            const pointLight2 = new THREE.PointLight(0xffffff, 3, 0, 0);
            pointLight2.position.set(-400, -400, -400);
            scene.add(pointLight2);
            
            scene.add(new THREE.AmbientLight(0xaaaaaa, 1.5));

            phoneGroup = new THREE.Group();
            const material = new THREE.MeshPhongMaterial({ 
                flatShading: true, 
                color: 0xcccccc,
                shininess: 30
            });
            
            // Scale factor to make phone bigger
            const scale = 1.8;
            
            // Phone base - made bigger and more detailed
            const phoneBaseShape = new THREE.Shape();
            phoneBaseShape.moveTo(-120 * scale, 80 * scale);
            phoneBaseShape.lineTo(-70 * scale, 80 * scale);
            phoneBaseShape.absarc(-50 * scale, 60 * scale, 20 * scale, Math.PI / 2, -Math.PI / 2, true);
            phoneBaseShape.lineTo(30 * scale, 40 * scale);
            phoneBaseShape.absarc(50 * scale, 60 * scale, 20 * scale, -Math.PI / 2, Math.PI / 2, false);
            phoneBaseShape.lineTo(120 * scale, 80 * scale);
            phoneBaseShape.lineTo(100 * scale, -80 * scale);
            phoneBaseShape.lineTo(-100 * scale, -80 * scale);
            phoneBaseShape.closePath();
            
            const extrudeSettings = { depth: 60 * scale, bevelEnabled: true, bevelSize: 2, bevelThickness: 2 };
            const solidBaseGeometry = new THREE.ExtrudeGeometry(phoneBaseShape, extrudeSettings);
            solidBaseGeometry.rotateX(Math.PI / 2);
            solidBaseGeometry.translate(0, -30 * scale, 0);

            const solidBase = new THREE.Mesh(solidBaseGeometry, material);
            phoneGroup.add(solidBase);

            // Dial plate - bigger and more prominent
            const dialPlate = new THREE.Mesh(
                new THREE.CylinderGeometry(80 * scale, 80 * scale, 10 * scale, 32), 
                material
            );
            dialPlate.position.set(0, 18 * scale, 0);
            phoneGroup.add(dialPlate);

            // Dial holes - bigger and more visible
            const holeRadius = 10 * scale;
            const dialRadius = 55 * scale;
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2;
                const hole = new THREE.Mesh(
                    new THREE.CylinderGeometry(holeRadius, holeRadius, 12 * scale, 16), 
                    new THREE.MeshPhongMaterial({ color: 0x333333 })
                );
                hole.position.set(
                    Math.cos(angle) * dialRadius, 
                    18 * scale, 
                    Math.sin(angle) * dialRadius
                );
                phoneGroup.add(hole);
            }

            // Finger stop
            const fingerStop = new THREE.Mesh(
                new THREE.TorusGeometry(8 * scale, 4 * scale, 8, 20), 
                material
            );
            fingerStop.position.set(70 * scale, 18 * scale, 50 * scale);
            fingerStop.rotation.x = Math.PI / 2;
            phoneGroup.add(fingerStop);

            // Handset - more detailed and bigger
            const handset = new THREE.Group();
            const handleCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-80 * scale, 0, 0), 
                new THREE.Vector3(-40 * scale, 20 * scale, 0),
                new THREE.Vector3(40 * scale, 20 * scale, 0), 
                new THREE.Vector3(80 * scale, 0, 0)
            ]);
            const handleGeometry = new THREE.TubeGeometry(handleCurve, 20, 15 * scale, 8, false);
            const handle = new THREE.Mesh(handleGeometry, material);
            
            const earpiece = new THREE.Mesh(
                new THREE.CylinderGeometry(35 * scale, 30 * scale, 25 * scale, 16), 
                material
            );
            earpiece.position.x = -90 * scale;
            
            const mouthpiece = new THREE.Mesh(
                new THREE.CylinderGeometry(35 * scale, 30 * scale, 25 * scale, 16), 
                material
            );
            mouthpiece.position.x = 90 * scale;
            
            handset.add(handle, earpiece, mouthpiece);
            handset.position.y = 75 * scale;
            phoneGroup.add(handset);
            
            // Coiled cord - more detailed and realistic
            const cordPoints = [];
            for (let i = 0; i < 120; i++) { 
                const angle = i * 0.6;
                const progress = i / 119;
                const spiralRadius = 15 * scale;
                cordPoints.push(new THREE.Vector3(
                    -100 * scale - Math.sin(progress * Math.PI * 0.5) * 80 * scale, 
                    30 * scale - progress * 80 * scale + Math.sin(angle) * spiralRadius, 
                    Math.cos(angle) * spiralRadius
                ));
            }
            const cordCurve = new THREE.CatmullRomCurve3(cordPoints);
            const cordGeometry = new THREE.TubeGeometry(cordCurve, 96, 4 * scale, 8, false);
            const cord = new THREE.Mesh(cordGeometry, new THREE.MeshPhongMaterial({ color: 0x444444 }));
            phoneGroup.add(cord);

            // Add a subtle phone base shadow/reflection
            const baseShadow = new THREE.Mesh(
                new THREE.CylinderGeometry(150 * scale, 150 * scale, 2, 32),
                new THREE.MeshPhongMaterial({ color: 0x999999, transparent: true, opacity: 0.3 })
            );
            baseShadow.position.y = -45 * scale;
            phoneGroup.add(baseShadow);

            scene.add(phoneGroup);

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(width, height);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            effect = AsciiEffect(renderer, ' .:-=+*#%@', { invert: true });
            effect.setSize(width, height);
            currentMount.appendChild(effect.domElement);
            
            animate();
        };
        
        const onWindowResize = (width, height) => {
            if (!renderer) return;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            effect.setSize(width, height);
        };
        
        const animate = () => {
            if (!renderer) return;
            animationFrameId = requestAnimationFrame(animate);
            const timer = Date.now() - start;
            
            // More realistic phone ringing animation
            const ringSpeed = 0.15; 
            const ringAmount = 3;
            const ringOffset = Math.sin(timer * ringSpeed) * ringAmount;
            
            phoneGroup.position.y = Math.abs(ringOffset);
            phoneGroup.rotation.x = Math.sin(timer * ringSpeed * 1.2) * 0.03;
            phoneGroup.rotation.z = Math.cos(timer * ringSpeed * 1.8) * 0.025;
            
            // Slow scene rotation
            scene.rotation.y = timer * 0.0001;
            
            effect.render(scene, camera);
        };

        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                if (!isInitialized) {
                    init(width, height);
                } else {
                    onWindowResize(width, height);
                }
            }
        });

        resizeObserver.observe(currentMount);
        
        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
            if (currentMount && effect && effect.domElement) {
                if (currentMount.contains(effect.domElement)) {
                    currentMount.removeChild(effect.domElement);
                }
            }
            if (scene) {
                scene.traverse(object => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if(Array.isArray(object.material)) object.material.forEach(m => m.dispose());
                        else object.material.dispose();
                    }
                });
            }
            if(renderer) renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} className="ascii-scene" />;
};

const Navigation = () => {
    return (
        <aside className="navigation">
            <h1 className="logo">LEONID GAVROVSKI</h1>
            <nav>
                <ul className="nav-list">
                    <li className="nav-item"><a href="#about" className="nav-link">About</a></li>
                    <li className="nav-item"><a href="#work" className="nav-link">Work</a></li>
                    <li className="nav-item"><a href="#achievements" className="nav-link">Achievements</a></li>
                    <li className="nav-item"><a href="#contact" className="nav-link">Contact</a></li>
                </ul>
            </nav>
        </aside>
    );
};

const Section = ({ id, title, children }) => (
    <section id={id} className="section">
        <h2 className="section-title">{title}</h2>
        {children}
    </section>
);

export default function App() {
    // Inject styles
    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
        
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    return (
        <div>
            <div className="container">
                <div className="grid">
                    <Navigation />
                    <main className="main-content">
                        <div id="about" className="hero-section">
                             <h2 className="hero-title">
                                CREATIVE
                                <br />
                                DESIGN &
                                <br />
                                DEVELOP.
                            </h2>
                             <div className="ascii-container">
                                <AsciiArtScene />
                             </div>
                        </div>

                        <Section title="SELECTED CLIENTS.">
                            <div className="clients-grid">
                                <p>Adidas</p><p>H&M</p><p>Unity</p>
                                <p>Samsung</p><p>Ebay</p><p>Google</p>
                            </div>
                        </Section>
                        
                        <Section id="work" title="RECENT WORK.">
                            <div>
                                <div className="work-item">
                                    <p className="work-date">AUG. 11 2024</p>
                                    <h3 className="work-title">
                                        E-commerce Platform Redesign <span className="arrow">→</span>
                                    </h3>
                                </div>
                                <div className="work-item">
                                    <p className="work-date">MAY. 20 2024</p>
                                    <h3 className="work-title">
                                        Interactive Data Visualization <span className="arrow">→</span>
                                    </h3>
                                </div>
                                 <div className="work-item">
                                    <p className="work-date">FEB. 01 2024</p>
                                    <h3 className="work-title">
                                        Mobile Banking App UI/UX <span className="arrow">→</span>
                                    </h3>
                                </div>
                            </div>
                        </Section>
                        
                        <Section id="achievements" title="AWARDS & ACHIEVEMENTS.">
                             <div>
                                <div className="achievements-list">
                                    <h3 className="achievement-category">AWWWARDS</h3>
                                    <ul className="achievement-items">
                                        <li>Site of the Day (x3)</li>
                                        <li>Developer Award</li>
                                        <li>Mobile Excellence</li>
                                    </ul>
                                </div>
                                <div className="achievements-list">
                                    <h3 className="achievement-category">BEHANCE</h3>
                                    <ul className="achievement-items">
                                        <li>Interaction Gallery (x2)</li>
                                    </ul>
                                </div>
                                 <div className="achievements-list">
                                    <h3 className="achievement-category">THE WEBBY AWARDS</h3>
                                    <ul className="achievement-items">
                                        <li>Nominee (x1)</li>
                                        <li>Honoree (x1)</li>
                                    </ul>
                                </div>
                            </div>
                        </Section>

                        <Section id="contact" title="CONTACT.">
                             <div>
                                <div>
                                    <a href="mailto:cicada.support@cicadakatz.space" className="contact-email">
                                        cicada.support@cicadakatz.space
                                    </a>
                                    <p className="contact-note">Work inquiries only.</p>
                                </div>
                                 <div>
                                    <h3 className="achievement-category">Social</h3>
                                    <ul className="social-list">
                                        <li><a href="#contact" className="social-link">Instagram</a></li>
                                        <li><a href="#contact" className="social-link">Twitter</a></li>
                                        <li><a href="#contact" className="social-link">LinkedIn</a></li>
                                        <li><a href="#contact" className="social-link">Github</a></li>
                                    </ul>
                                </div>
                            </div>
                        </Section>
                        
                        <footer className="footer">
                            &copy; 2025 CicadaKatz. All Rights Reserved.
                        </footer>

                    </main>
                </div>
            </div>
        </div>
    );
}
