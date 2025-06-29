import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

//================================================================================
// THREE.js ASCII Effect
//================================================================================
const AsciiEffect = ( renderer, charSet = ' .:-=+*#%@', options = {} ) => {
    const fCharSet = charSet;
    const bResolution = !options.resolution ? 0.20 : options.resolution;
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
            camera.position.set(0, 150, 400); 

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0, 0, 0);

            const pointLight1 = new THREE.PointLight(0xffffff, 4, 0, 0);
            pointLight1.position.set(500, 500, 500);
            scene.add(pointLight1);

            const pointLight2 = new THREE.PointLight(0xffffff, 2, 0, 0);
            pointLight2.position.set(-500, -500, -500);
            scene.add(pointLight2);
            
            scene.add(new THREE.AmbientLight(0xaaaaaa, 1));

            phoneGroup = new THREE.Group();
            const material = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xcccccc });
            
            const phoneBaseShape = new THREE.Shape();
            phoneBaseShape.moveTo(-120, 80);
            phoneBaseShape.lineTo(-70, 80);
            phoneBaseShape.absarc(-50, 60, 20, Math.PI / 2, -Math.PI / 2, true);
            phoneBaseShape.lineTo(30, 40);
            phoneBaseShape.absarc(50, 60, 20, -Math.PI / 2, Math.PI / 2, false);
            phoneBaseShape.lineTo(120, 80);
            phoneBaseShape.lineTo(100, -80);
            phoneBaseShape.lineTo(-100, -80);
            phoneBaseShape.closePath();
            
            const extrudeSettings = { depth: 60, bevelEnabled: false };
            const solidBaseGeometry = new THREE.ExtrudeGeometry(phoneBaseShape, extrudeSettings);
            solidBaseGeometry.rotateX(Math.PI / 2);
            solidBaseGeometry.translate(0, -30, 0);

            const solidBase = new THREE.Mesh(solidBaseGeometry, material);
            phoneGroup.add(solidBase);

            const dialPlate = new THREE.Mesh(new THREE.CylinderGeometry(80, 80, 10, 32), material);
            dialPlate.position.set(0, 18, 0);
            phoneGroup.add(dialPlate);

            const holeRadius = 10;
            const dialRadius = 55;
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2;
                const hole = new THREE.Mesh(new THREE.CylinderGeometry(holeRadius, holeRadius, 12, 16), material);
                hole.position.set(Math.cos(angle) * dialRadius, 18, Math.sin(angle) * dialRadius);
                phoneGroup.add(hole);
            }
            const fingerStop = new THREE.Mesh(new THREE.TorusGeometry(8, 4, 8, 20), material);
            fingerStop.position.set(70, 18, 50);
            fingerStop.rotation.x = Math.PI / 2;
            phoneGroup.add(fingerStop);

            const handset = new THREE.Group();
            const handleCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-80, 0, 0), new THREE.Vector3(-40, 20, 0),
                new THREE.Vector3(40, 20, 0), new THREE.Vector3(80, 0, 0)
            ]);
            const handleGeometry = new THREE.TubeGeometry(handleCurve, 20, 15, 8, false);
            const handle = new THREE.Mesh(handleGeometry, material);
            const earpiece = new THREE.Mesh(new THREE.CylinderGeometry(35, 30, 25, 16), material);
            earpiece.position.x = -90;
            const mouthpiece = new THREE.Mesh(new THREE.CylinderGeometry(35, 30, 25, 16), material);
            mouthpiece.position.x = 90;
            handset.add(handle, earpiece, mouthpiece);
            handset.position.y = 75;
            phoneGroup.add(handset);
            
            const cordPoints = [];
            for (let i = 0; i < 80; i++) { 
                const angle = i * 0.4;
                const progress = i / 79;
                cordPoints.push(new THREE.Vector3(-100 - Math.sin(progress * Math.PI * 0.5) * 50, 30 - progress * 50 + Math.sin(angle) * 10, Math.cos(angle) * 10));
            }
            const cordCurve = new THREE.CatmullRomCurve3(cordPoints);
            const cordGeometry = new THREE.TubeGeometry(cordCurve, 64, 4, 8, false);
            const cord = new THREE.Mesh(cordGeometry, material);
            phoneGroup.add(cord);

            scene.add(phoneGroup);

            renderer = new THREE.WebGLRenderer();
            renderer.setSize(width, height);

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
            const ringSpeed = 0.2; 
            const ringAmount = 1.5;
            phoneGroup.position.y = Math.abs(Math.sin(timer * ringSpeed)) * ringAmount;
            phoneGroup.rotation.x = Math.sin(timer * ringSpeed * 1.5) * 0.02;
            phoneGroup.rotation.z = Math.cos(timer * ringSpeed * 2.0) * 0.02;
            scene.rotation.y = timer * 0.0002;
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

    const asciiSceneStyle = {
        width: '100%',
        aspectRatio: '16/9',
        maxHeight: '500px',
        backgroundColor: '#D7E7E9',
        borderRadius: '8px'
    };

    return <div ref={mountRef} style={asciiSceneStyle} />;
};

const Navigation = () => {
    const asideStyle = {
        padding: '2rem',
        position: 'sticky',
        top: '0',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
    };

    const headerStyle = {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#5A768A',
        letterSpacing: '0.1em',
        marginBottom: 'auto'
    };

    const navListStyle = {
        listStyle: 'none',
        padding: '0',
        margin: '0'
    };

    const navItemStyle = {
        marginBottom: '0.75rem'
    };

    const navLinkStyle = {
        fontSize: '1.125rem',
        color: '#6F90A8',
        textDecoration: 'none',
        transition: 'color 0.3s ease'
    };

    const navLinkHoverStyle = {
        color: '#5A768A'
    };

    return (
        <aside style={asideStyle}>
            <h1 style={headerStyle}>LEONID GAVROVSKI</h1>
            <nav>
                <ul style={navListStyle}>
                    <li style={navItemStyle}>
                        <a href="#about" style={navLinkStyle} 
                           onMouseEnter={(e) => e.target.style.color = navLinkHoverStyle.color}
                           onMouseLeave={(e) => e.target.style.color = navLinkStyle.color}>
                            About
                        </a>
                    </li>
                    <li style={navItemStyle}>
                        <a href="#work" style={navLinkStyle}
                           onMouseEnter={(e) => e.target.style.color = navLinkHoverStyle.color}
                           onMouseLeave={(e) => e.target.style.color = navLinkStyle.color}>
                            Work
                        </a>
                    </li>
                    <li style={navItemStyle}>
                        <a href="#achievements" style={navLinkStyle}
                           onMouseEnter={(e) => e.target.style.color = navLinkHoverStyle.color}
                           onMouseLeave={(e) => e.target.style.color = navLinkStyle.color}>
                            Achievements
                        </a>
                    </li>
                    <li style={navItemStyle}>
                        <a href="#contact" style={navLinkStyle}
                           onMouseEnter={(e) => e.target.style.color = navLinkHoverStyle.color}
                           onMouseLeave={(e) => e.target.style.color = navLinkStyle.color}>
                            Contact
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

const Section = ({ id, title, children }) => {
    const sectionStyle = {
        minHeight: '50vh',
        padding: '4rem 2rem',
        borderTop: '1px solid #C2D7DD'
    };

    const titleStyle = {
        fontSize: '3.5rem',
        fontWeight: 'bold',
        color: '#5A768A',
        marginBottom: '3rem',
        lineHeight: '1.1'
    };

    return (
        <section id={id} style={sectionStyle}>
            <h2 style={titleStyle}>{title}</h2>
            {children}
        </section>
    );
};

export default function App() {
    const appStyle = {
        backgroundColor: '#D7E7E9',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    };

    const containerStyle = {
        maxWidth: '1200px',
        margin: '0 auto'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 2fr'
    };

    const heroSectionStyle = {
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '4rem 2rem'
    };

    const heroTitleStyle = {
        position: 'relative',
        zIndex: '10',
        fontSize: '4.5rem',
        fontWeight: '800',
        color: '#5A768A',
        marginBottom: '1rem',
        lineHeight: '1.1'
    };

    const heroAsciiStyle = {
        position: 'absolute',
        top: '45%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        padding: '0 2rem'
    };

    const clientsGridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#6F90A8'
    };

    const workItemStyle = {
        marginBottom: '3rem'
    };

    const workDateStyle = {
        color: '#A3B5C0',
        fontSize: '0.875rem',
        marginBottom: '0.5rem'
    };

    const workTitleStyle = {
        fontSize: '1.875rem',
        color: '#6F90A8',
        fontWeight: '600',
        textDecoration: 'none',
        transition: 'color 0.3s ease'
    };

    const achievementSectionStyle = {
        marginBottom: '2rem'
    };

    const achievementTitleStyle = {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#6F90A8',
        marginBottom: '0.5rem'
    };

    const achievementListStyle = {
        color: '#6F90A8',
        paddingLeft: '1.5rem'
    };

    const contactEmailStyle = {
        fontSize: '2rem',
        color: '#6F90A8',
        textDecoration: 'none',
        transition: 'color 0.3s ease'
    };

    const contactSocialStyle = {
        marginTop: '2rem'
    };

    const socialListStyle = {
        color: '#6F90A8',
        listStyle: 'none',
        padding: '0'
    };

    const socialLinkStyle = {
        color: '#6F90A8',
        textDecoration: 'none',
        transition: 'color 0.3s ease'
    };

    const footerStyle = {
        textAlign: 'center',
        padding: '2rem',
        color: '#A3B5C0',
        fontSize: '0.875rem'
    };

    // Responsive styles for mobile
    const mobileStyles = `
        @media (max-width: 768px) {
            .grid-container {
                grid-template-columns: 1fr !important;
            }
            .hero-title {
                font-size: 3rem !important;
            }
            .section-title {
                font-size: 2.5rem !important;
            }
            .clients-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
            .navigation {
                position: static !important;
                height: auto !important;
                padding: 1rem !important;
            }
            .section {
                padding: 2rem 1rem !important;
            }
            .hero-section {
                padding: 2rem 1rem !important;
            }
        }
    `;

    return (
        <div style={appStyle}>
            <style>{mobileStyles}</style>
            <div style={containerStyle}>
                <div style={gridStyle} className="grid-container">
                    <div>
                        <div className="navigation">
                            <Navigation />
                        </div>
                    </div>
                    <main>
                        <div id="about" style={heroSectionStyle} className="hero-section">
                            <h2 style={heroTitleStyle} className="hero-title">
                                CREATIVE
                                <br />
                                DESIGN &
                                <br />
                                DEVELOP.
                            </h2>
                            <div style={heroAsciiStyle}>
                                <AsciiArtScene />
                            </div>
                        </div>

                        <div className="section" style={{minHeight: '50vh', padding: '4rem 2rem', borderTop: '1px solid #C2D7DD'}}>
                            <h2 style={{fontSize: '3.5rem', fontWeight: 'bold', color: '#5A768A', marginBottom: '3rem', lineHeight: '1.1'}} className="section-title">
                                SELECTED CLIENTS.
                            </h2>
                            <div style={clientsGridStyle} className="clients-grid">
                                <p>Adidas</p><p>H&M</p><p>Unity</p>
                                <p>Samsung</p><p>Ebay</p><p>Google</p>
                            </div>
                        </div>
                        
                        <Section id="work" title="RECENT WORK.">
                            <div>
                                <div style={workItemStyle}>
                                    <p style={workDateStyle}>AUG. 11 2024</p>
                                    <a href="#" style={workTitleStyle}
                                       onMouseEnter={(e) => e.target.style.color = '#5A768A'}
                                       onMouseLeave={(e) => e.target.style.color = '#6F90A8'}>
                                        E-commerce Platform Redesign →
                                    </a>
                                </div>
                                <div style={workItemStyle}>
                                    <p style={workDateStyle}>MAY. 20 2024</p>
                                    <a href="#" style={workTitleStyle}
                                       onMouseEnter={(e) => e.target.style.color = '#5A768A'}
                                       onMouseLeave={(e) => e.target.style.color = '#6F90A8'}>
                                        Interactive Data Visualization →
                                    </a>
                                </div>
                                <div style={workItemStyle}>
                                    <p style={workDateStyle}>FEB. 01 2024</p>
                                    <a href="#" style={workTitleStyle}
                                       onMouseEnter={(e) => e.target.style.color = '#5A768A'}
                                       onMouseLeave={(e) => e.target.style.color = '#6F90A8'}>
                                        Mobile Banking App UI/UX →
                                    </a>
                                </div>
                            </div>
                        </Section>
                        
                        <Section id="achievements" title="AWARDS & ACHIEVEMENTS.">
                            <div>
                                <div style={achievementSectionStyle}>
                                    <h3 style={achievementTitleStyle}>AWWWARDS</h3>
                                    <ul style={achievementListStyle}>
                                        <li>Site of the Day (x3)</li>
                                        <li>Developer Award</li>
                                        <li>Mobile Excellence</li>
                                    </ul>
                                </div>
                                <div style={achievementSectionStyle}>
                                    <h3 style={achievementTitleStyle}>BEHANCE</h3>
                                    <ul style={achievementListStyle}>
                                        <li>Interaction Gallery (x2)</li>
                                    </ul>
                                </div>
                                <div style={achievementSectionStyle}>
                                    <h3 style={achievementTitleStyle}>THE WEBBY AWARDS</h3>
                                    <ul style={achievementListStyle}>
                                        <li>Nominee (x1)</li>
                                        <li>Honoree (x1)</li>
                                    </ul>
                                </div>
                            </div>
                        </Section>

                        <Section id="contact" title="CONTACT.">
                            <div>
                                <div style={{marginBottom: '2rem'}}>
                                    <a href="mailto:cicada.support@cicadakatz.space" style={contactEmailStyle}
                                       onMouseEnter={(e) => e.target.style.color = '#5A768A'}
                                       onMouseLeave={(e) => e.target.style.color = '#6F90A8'}>
                                        cicada.support@cicadakatz.space
                                    </a>
                                    <p style={{color: '#A3B5C0', marginTop: '0.5rem'}}>Work inquiries only.</p>
                                </div>
                                <div style={contactSocialStyle}>
                                    <h3 style={achievementTitleStyle}>Social</h3>
                                    <ul style={socialListStyle}>
                                        <li><a href="#contact" style={socialLinkStyle}
                                               onMouseEnter={(e) => e.target.style.color = '#5A768A'}
                                               onMouseLeave={(e) => e.target.style.color = '#6F90A8'}>Instagram</a></li>
                                        <li><a href="#contact" style={socialLinkStyle}
                                               onMouseEnter={(e) => e.target.style.color = '#5A768A'}
                                               onMouseLeave={(e) => e.target.style.color = '#6F90A8'}>Twitter</a></li>
                                        <li><a href="#contact" style={socialLinkStyle}
                                               onMouseEnter={(e) => e.target.style.color = '#5A768A'}
                                               onMouseLeave={(e) => e.target.style.color = '#6F90A8'}>LinkedIn</a></li>
                                        <li><a href="#contact" style={socialLinkStyle}
                                               onMouseEnter={(e) => e.target.style.color = '#5A768A'}
                                               onMouseLeave={(e) => e.target.style.color = '#6F90A8'}>Github</a></li>
                                    </ul>
                                </div>
                            </div>
                        </Section>
                        
                        <footer style={footerStyle}>
                            &copy; 2025 CicadaKatz. All Rights Reserved.
                        </footer>

                    </main>
                </div>
            </div>
        </div>
    );
}
