import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

//================================================================================
// THREE.js ASCII Effect
// This is the source code for the AsciiEffect, adapted from the three.js examples.
// I've included it here directly to ensure the component is self-contained.
// The code has been modified to resolve a canvas context issue for rendering.
//================================================================================
const AsciiEffect = ( renderer, charSet = ' .:-=+*#%@', options = {} ) => {
    // Final character set
    const fCharSet = charSet;

    // Options
    const bResolution = !options.resolution ? 0.20 : options.resolution; // pixels per character, increased for more detail
    const iScale = !options.scale ? 1 : options.scale;
    const bColor = !options.color ? false : options.color; // color flag
    const bAlpha = !options.alpha ? false : options.alpha; // alpha flag
    const bBlock = !options.block ? false : options.block; // background block flag
    const bInvert = !options.invert ? false : options.invert; // invert lightness

    // Details
    let iWidth, iHeight;
    const iChar_hd = 2; // Half character height

    // Create container
    const oAscii = document.createElement('div');
    oAscii.style.fontFamily = 'monospace';
    oAscii.style.lineHeight = '1';

    // Hidden canvas for reading pixel data
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

        // Ascii character cell count
        const iCellsX = Math.round(bResolution * width);
        const iCellsY = Math.round(bResolution * height / iChar_hd);

        oAscii.style.width = width + 'px';
        oAscii.style.height = height + 'px';
        oAscii.style.color = '#5A768A'; // Darkest blue for text
        oAscii.style.backgroundColor = '#D7E7E9'; // Lightest blue for background
        oAscii.style.whiteSpace = 'pre';
        oAscii.style.margin = '0px';
        oAscii.style.padding = '0px';
        oAscii.style.letterSpacing = '-0.15em'; // Adjusted for better density

        // Pre-fill with spaces
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
        const sChars = fCharSet;
        const iChar_ln = sChars.length - 1;

        // Draw the webgl canvas to the hidden 2d canvas
        hiddenCtx.clearRect(0, 0, iWidth, iHeight);
        hiddenCtx.drawImage(renderer.domElement, 0, 0, iWidth, iHeight);

        let oData;
        try {
            oData = hiddenCtx.getImageData(0, 0, iWidth, iHeight).data;
        } catch (e) {
            console.error("AsciiEffect: Could not get image data.", e);
            return;
        }


        // Ascii character cell count
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

    return {
        domElement,
        render,
        setSize,
    };
};

//================================================================================
// React Components
//================================================================================

/**
 * The main Three.js scene component for the ringing ASCII phone.
 * The 3D model has been completely rebuilt for more detail and texture.
 */
const AsciiArtScene = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        let camera, scene, renderer, effect;
        let phoneGroup;
        let animationFrameId;

        const start = Date.now();

        // Init scene
        const init = () => {
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;

            camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
            camera.position.set(0, 150, 400);

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0, 0, 0);

            // Lighting
            const pointLight1 = new THREE.PointLight(0xffffff, 4, 0, 0);
            pointLight1.position.set(500, 500, 500);
            scene.add(pointLight1);

            const pointLight2 = new THREE.PointLight(0xffffff, 2, 0, 0);
            pointLight2.position.set(-500, -500, -500);
            scene.add(pointLight2);

            scene.add(new THREE.AmbientLight(0xaaaaaa, 1));

            // Create Phone Model
            phoneGroup = new THREE.Group();
            const material = new THREE.MeshPhongMaterial({ flatShading: true, color: 0xcccccc });

            // --- Base of the Phone ---
            const baseShape = new THREE.Shape();
            baseShape.moveTo(-100, -80);
            baseShape.lineTo(100, -80);
            baseShape.lineTo(120, 80);
            baseShape.lineTo(-120, 80);
            baseShape.closePath();
            const extrudeSettings = { depth: 60, bevelEnabled: true, bevelThickness: 5, bevelSize: 5, bevelSegments: 2 };
            const baseGeometry = new THREE.ExtrudeGeometry(baseShape, extrudeSettings);
            const base = new THREE.Mesh(baseGeometry, material);
            base.rotation.x = Math.PI / 2;
            base.position.y = -30;
            phoneGroup.add(base);

            // --- Rotary Dial ---
            const dialPlate = new THREE.Mesh(new THREE.CylinderGeometry(80, 80, 10, 32), material);
            dialPlate.position.set(0, 18, 0);
            phoneGroup.add(dialPlate);

            // Dial finger holes
            const holeRadius = 10;
            const dialRadius = 55;
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2;
                const hole = new THREE.Mesh(new THREE.CylinderGeometry(holeRadius, holeRadius, 12, 16), material);
                hole.position.set(
                    Math.cos(angle) * dialRadius,
                    18,
                    Math.sin(angle) * dialRadius
                );
                phoneGroup.add(hole);
            }
            // Finger stop
            const fingerStop = new THREE.Mesh(new THREE.TorusGeometry(8, 4, 8, 20), material);
            fingerStop.position.set(70, 18, 50);
            fingerStop.rotation.x = Math.PI / 2;
            phoneGroup.add(fingerStop);


            // --- Handset ---
            const handset = new THREE.Group();
            const handleCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-80, 0, 0),
                new THREE.Vector3(-40, 20, 0),
                new THREE.Vector3(40, 20, 0),
                new THREE.Vector3(80, 0, 0)
            ]);
            const handleGeometry = new THREE.TubeGeometry(handleCurve, 20, 15, 8, false);
            const handle = new THREE.Mesh(handleGeometry, material);

            const earpiece = new THREE.Mesh(new THREE.CylinderGeometry(35, 30, 25, 16), material);
            earpiece.position.x = -90;

            const mouthpiece = new THREE.Mesh(new THREE.CylinderGeometry(35, 30, 25, 16), material);
            mouthpiece.position.x = 90;

            handset.add(handle);
            handset.add(earpiece);
            handset.add(mouthpiece);
            handset.position.y = 75;
            phoneGroup.add(handset);

            // --- Cradle ---
            const cradleShape = new THREE.Shape();
            cradleShape.moveTo(0,0);
            cradleShape.absarc(0, 20, 20, Math.PI, Math.PI * 2, false);
            cradleShape.lineTo(20, 0);
            cradleShape.lineTo(0,0);
            const cradleExtrudeSettings = { depth: 160, bevelEnabled: false };
            const cradleGeometry = new THREE.ExtrudeGeometry(cradleShape, cradleExtrudeSettings);

            const cradle1 = new THREE.Mesh(cradleGeometry, material);
            cradle1.rotation.y = Math.PI/2;
            cradle1.position.set(-50, 25, 80);
            phoneGroup.add(cradle1);

            const cradle2 = cradle1.clone();
            cradle2.position.x = 50;
            phoneGroup.add(cradle2);

            // --- Curly Cord (REVISED) ---
            const cordPoints = [];
            for (let i = 0; i < 80; i++) { // More points for a smoother curve
                const angle = i * 0.4; // Tighter coils
                const progress = i / 79; // From 0 to 1
                const x = -100 - Math.sin(progress * Math.PI * 0.5) * 50; // Starts at x=-100, bows out and drops
                const y = 30 - progress * 50 + Math.sin(angle) * 10; // Starts at y=30, drops down to y=-20, and wiggles
                const z = Math.cos(angle) * 10; // Coil on z-axis
                cordPoints.push(new THREE.Vector3(x, y, z));
            }
            const cordCurve = new THREE.CatmullRomCurve3(cordPoints);
            const cordGeometry = new THREE.TubeGeometry(cordCurve, 64, 4, 8, false); // Thinner cord
            const cord = new THREE.Mesh(cordGeometry, material);
            phoneGroup.add(cord);


            scene.add(phoneGroup);

            // Renderer
            renderer = new THREE.WebGLRenderer();
            renderer.setSize(width, height);

            // ASCII Effect
            effect = AsciiEffect(renderer, ' .:-=+*#%@', { invert: true });
            effect.setSize(width, height);
            mountRef.current.appendChild(effect.domElement);

            window.addEventListener('resize', onWindowResize);
        };

        // Handle window resize
        const onWindowResize = () => {
            if (!mountRef.current) return;
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
            effect.setSize(width, height);
        };

        // Animation loop
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            const timer = Date.now() - start;

            // Ringing animation (REVISED)
            const ringSpeed = 0.2; // Faster ringing
            const ringAmount = 1.5; // More vertical bounce
            phoneGroup.position.y = Math.abs(Math.sin(timer * ringSpeed)) * ringAmount; // Jumps up and down
            phoneGroup.rotation.x = Math.sin(timer * ringSpeed * 1.5) * 0.02; // More tilt
            phoneGroup.rotation.z = Math.cos(timer * ringSpeed * 2.0) * 0.02; // More twist

            // Rotate the whole scene
            scene.rotation.y = timer * 0.0002;

            effect.render(scene, camera);
        };

        init();
        animate();

        // Cleanup function
        return () => {
            window.removeEventListener('resize', onWindowResize);
            cancelAnimationFrame(animationFrameId);
            if (mountRef.current && effect.domElement) {
                if (mountRef.current.contains(effect.domElement)) {
                    mountRef.current.removeChild(effect.domElement);
                }
            }
            if (scene) {
                scene.traverse(object => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
            }
            if(renderer) renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} className="w-full h-full min-h-[300px] md:min-h-[500px] bg-[#D7E7E9] rounded-lg" />;
};


/**
 * Left-side navigation component.
 */
const Navigation = () => {
    return (
        <aside className="p-8 md:p-10 lg:p-12 sticky top-0 h-screen flex flex-col">
            <h1 className="text-xl font-bold text-[#5A768A] tracking-wider mb-auto">JOHN DOE</h1>
            <nav>
                <ul className="space-y-3">
                    <li><a href="#about" className="text-lg text-[#6F90A8] hover:text-[#5A768A] transition-colors duration-300">About</a></li>
                    <li><a href="#work" className="text-lg text-[#6F90A8] hover:text-[#5A768A] transition-colors duration-300">Work</a></li>
                    <li><a href="#achievements" className="text-lg text-[#6F90A8] hover:text-[#5A768A] transition-colors duration-300">Achievements</a></li>
                    <li><a href="#contact" className="text-lg text-[#6F90A8] hover:text-[#5A768A] transition-colors duration-300">Contact</a></li>
                </ul>
            </nav>
        </aside>
    );
};

/**
 * Section component for consistent styling.
 */
const Section = ({ id, title, children }) => (
    <section id={id} className="min-h-[50vh] py-16 px-8 md:px-10 lg:px-12 border-t border-[#C2D7DD]">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#5A768A] mb-12">{title}</h2>
        {children}
    </section>
);


/**
 * Main App Component
 */
export default function App() {

    // Define the color palette based on the user-provided image
    const oceanBreezePalette = {
        lightestBlue: '#D7E7E9',
        lightBlue: '#C2D7DD',
        greyBlue: '#A3B5C0',
        midBlue: '#6F90A8',
        darkestBlue: '#5A768A',
    };

    return (
        <div style={{ backgroundColor: oceanBreezePalette.lightestBlue }} className="min-h-screen font-sans">
            <div className="container mx-auto">
                <div className="md:grid md:grid-cols-12">
                    <div className="md:col-span-4 lg:col-span-3">
                        <Navigation />
                    </div>
                    <main className="md:col-span-8 lg:col-span-9">

                        {/* Hero Section with ASCII Art */}
                        <div id="about" className="min-h-screen flex flex-col justify-center py-16 px-8 md:px-10 lg:px-12">
                            <h2 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-[#5A768A] mb-4 leading-tight">
                                CREATIVE
                                <br />
                                DESIGN &
                                <br />
                                DEVELOP.
                            </h2>
                            <div className="w-full mt-8">
                                <AsciiArtScene />
                            </div>
                        </div>

                        {/* Selected Clients Section */}
                        <Section title="SELECTED CLIENTS.">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-2xl font-bold text-[#6F90A8]">
                                <p>Adidas</p>
                                <p>H&M</p>
                                <p>Unity</p>
                                <p>Samsung</p>
                                <p>Ebay</p>
                                <p>Google</p>
                            </div>
                        </Section>

                        {/* Recent Work Section */}
                        <Section id="work" title="RECENT WORK.">
                            <div className="space-y-12">
                                <div className="group">
                                    <p className="text-[#A3B5C0] text-sm mb-2">AUG. 11 2024</p>
                                    <h3 className="text-3xl text-[#6F90A8] group-hover:text-[#5A768A] transition-colors duration-300 font-semibold">
                                        E-commerce Platform Redesign <span className="inline-block transform group-hover:translate-x-2 transition-transform duration-300">→</span>
                                    </h3>
                                </div>
                                <div className="group">
                                    <p className="text-[#A3B5C0] text-sm mb-2">MAY. 20 2024</p>
                                    <h3 className="text-3xl text-[#6F90A8] group-hover:text-[#5A768A] transition-colors duration-300 font-semibold">
                                        Interactive Data Visualization <span className="inline-block transform group-hover:translate-x-2 transition-transform duration-300">→</span>
                                    </h3>
                                </div>
                                <div className="group">
                                    <p className="text-[#A3B5C0] text-sm mb-2">FEB. 01 2024</p>
                                    <h3 className="text-3xl text-[#6F90A8] group-hover:text-[#5A768A] transition-colors duration-300 font-semibold">
                                        Mobile Banking App UI/UX <span className="inline-block transform group-hover:translate-x-2 transition-transform duration-300">→</span>
                                    </h3>
                                </div>
                            </div>
                        </Section>

                        {/* Awards & Achievements Section */}
                        <Section id="achievements" title="AWARDS & ACHIEVEMENTS.">
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-2xl font-semibold text-[#6F90A8] mb-2">AWWWARDS</h3>
                                    <ul className="text-[#6F90A8] list-disc list-inside">
                                        <li>Site of the Day (x3)</li>
                                        <li>Developer Award</li>
                                        <li>Mobile Excellence</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-[#6F90A8] mb-2">BEHANCE</h3>
                                    <ul className="text-[#6F90A8] list-disc list-inside">
                                        <li>Interaction Gallery (x2)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-[#6F90A8] mb-2">THE WEBBY AWARDS</h3>
                                    <ul className="text-[#6F90A8] list-disc list-inside">
                                        <li>Nominee (x1)</li>
                                        <li>Honoree (x1)</li>
                                    </ul>
                                </div>
                            </div>
                        </Section>

                        {/* Contact Section */}
                        <Section id="contact" title="CONTACT.">
                            <div className="space-y-8">
                                <div>
                                    <a href="mailto:hello@johndoe.com" className="text-3xl md:text-4xl text-[#6F90A8] hover:text-[#5A768A] transition-colors duration-300">
                                        hello@johndoe.com
                                    </a>
                                    <p className="text-[#A3B5C0] mt-2">Work inquiries only.</p>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-[#6F90A8] mb-2">Social</h3>
                                    <ul className="text-[#6F90A8]">
                                        <li><a href="#" className="hover:text-[#5A768A]">Instagram</a></li>
                                        <li><a href="#" className="hover:text-[#5A768A]">Twitter</a></li>
                                        <li><a href="#" className="hover:text-[#5A768A]">LinkedIn</a></li>
                                        <li><a href="#" className="hover:text-[#5A768A]">Github</a></li>
                                    </ul>
                                </div>
                            </div>
                        </Section>

                        {/* Footer */}
                        <footer className="text-center p-8 text-[#A3B5C0] text-sm">
                            &copy; 2025 John Doe. All Rights Reserved.
                        </footer>

                    </main>
                </div>
            </div>
        </div>
    );
}
