import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// Set global handlers to avoid scope problems with inline HTML click handlers
window.openModal = function () { document.getElementById('download-modal').classList.add('open'); };
window.closeModal = function () { document.getElementById('download-modal').classList.remove('open'); };
window.openUploadModal = function () { document.getElementById('upload-modal').classList.add('open'); };
window.closeUploadModal = function () {
    document.getElementById('upload-modal').classList.remove('open');
    resetUploadForm();
};
window.openAllSchematicsModal = function () { document.getElementById('all-schematics-modal').style.display = 'flex'; };
window.closeAllSchematicsModal = function () { document.getElementById('all-schematics-modal').style.display = 'none'; };

// Modal triggers
document.getElementById('download-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('download-modal')) closeModal();
});
document.getElementById('upload-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('upload-modal')) closeUploadModal();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeUploadModal(); closeDelayModal(); }
});

// Ticker & basic animation setup
window.addEventListener('scroll', () => {
    const s = document.documentElement.scrollTop;
    const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    document.getElementById('progress').style.width = (s / h * 100) + '%';
});

const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

window.downloadBoth = function () {
    const files = [
        { url: 'astra18.html', name: 'astra18.html' },
        { url: 'astra112.html', name: 'astra112.html' }
    ];
    files.forEach((file, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 500);
    });
};

// Theme controller
const html = document.documentElement;
const icon = document.getElementById('themeIcon');
const saved = localStorage.getItem('ac2-theme') || 'light';
applyTheme(saved);

function applyTheme(t) {
    html.setAttribute('data-theme', t);
    icon.className = t === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
    localStorage.setItem('ac2-theme', t);
}
document.getElementById('themeToggle').addEventListener('click', () => {
    applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// Delay announcement removed

// ── 3D Schematic Thumbnail Generator Engine ──
const TEXTURE_BASE_URL = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.12.2/assets/minecraft/textures/blocks/';
const loadedTextures = {};
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

function getBlockMaterial(id, meta) {
    let tex = null;
    let alpha = false;
    let color = null;
    let geomType = 'CUBE';

    const colors = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'silver', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'];
    const hexColors = [0xe4e4e4, 0xea7e35, 0xbe49c9, 0x6387d2, 0xc2b51c, 0x39ba2e, 0xd98199, 0x414141, 0xa0a7a7, 0x267191, 0x7e34bf, 0x253192, 0x56331c, 0x364b18, 0x9e2b27, 0x181414];
    const woodTypes = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'];

    const mcColor = colors[meta % 16];
    const hex = hexColors[meta % 16];
    const wood = woodTypes[meta % 6];
    const woodSlab = woodTypes[meta & 7];

    switch (id) {
        case 1: tex = 'stone.png'; break;
        case 2: tex = 'grass_side.png'; color = 0x7CB059; break;
        case 3: tex = 'dirt.png'; break;
        case 4: tex = 'cobblestone.png'; break;
        case 5: tex = `planks_${wood}.png`; break;
        case 17: tex = `log_${woodTypes[meta % 4]}.png`; break;
        case 18: tex = `leaves_${woodTypes[meta % 4]}.png`; alpha = true; break;
        case 20: tex = 'glass.png'; alpha = true; break;
        case 35: tex = `wool_colored_${mcColor}.png`; color = hex; break;
        case 44:
            tex = 'stone_slab_top.png';
            geomType = (meta & 8) ? 'SLAB_TOP' : 'SLAB_BOTTOM';
            break;
        case 53: tex = 'planks_oak.png'; geomType = 'STAIRS'; break;
        case 67: tex = 'cobblestone.png'; geomType = 'STAIRS'; break;
        case 109: tex = 'stonebrick.png'; geomType = 'STAIRS'; break;
        case 134: tex = 'planks_spruce.png'; geomType = 'STAIRS'; break;
        case 135: tex = 'planks_birch.png'; geomType = 'STAIRS'; break;
        case 136: tex = 'planks_jungle.png'; geomType = 'STAIRS'; break;
        case 54: tex = 'chest_front.png'; geomType = 'CHEST'; break;
        case 50: tex = 'torch_on.png'; alpha = true; geomType = 'CROSS'; break;
        case 65: tex = 'ladder.png'; alpha = true; geomType = 'PANE'; break;
        case 171: tex = `wool_colored_${mcColor}.png`; geomType = 'PLATE'; color = hex; break;
        case 85: tex = 'planks_oak.png'; geomType = 'FENCE'; break;
        case 101: tex = 'iron_bars.png'; alpha = true; geomType = 'PANE_CROSS'; break;
        case 102: tex = 'glass.png'; alpha = true; geomType = 'PANE_CROSS'; break;
        case 160: tex = `glass_stained_${mcColor}.png`; alpha = true; geomType = 'PANE_CROSS'; color = hex; break;
        case 251: tex = `concrete_${mcColor}.png`; color = hex; break;
        case 252: tex = `concrete_powder_${mcColor}.png`; color = hex; break;
        case 41: tex = 'gold_block.png'; break;
        case 42: tex = 'iron_block.png'; break;
        case 45: tex = 'brick.png'; break;
        case 98: tex = 'stonebrick.png'; break;
        case 89: tex = 'glowstone.png'; break;
        case 159: tex = `hardened_clay_stained_${mcColor}.png`; color = hex; break;
        // New block types
        case 66: tex = 'rail.png'; geomType = 'RAIL'; break; // Rail
        case 27: tex = 'powered_rail.png'; geomType = 'RAIL'; break; // Powered Rail
        case 28: tex = 'detector_rail.png'; geomType = 'RAIL'; break; // Detector Rail
        case 157: tex = 'activator_rail.png'; geomType = 'RAIL'; break; // Activator Rail
        case 145: tex = 'anvil_top.png'; geomType = 'ANVIL'; break; // Anvil
        case 30: tex = 'cobweb.png'; alpha = true; geomType = 'CROSS'; break; // Cobweb as cross
        case 96: tex = 'trapdoor.png'; geomType = 'SLAB_TOP'; break; // Trapdoor as slab top
        case 124: tex = 'snow.png'; geomType = 'SLAB_BOTTOM'; break; // Snow layer as slab bottom
        default: tex = null; break;
    }

    if (color === null) {
        color = new THREE.Color().setHSL((((id + meta * 0.1) * 137.5) % 360) / 360, 0.7, 0.6).getHex();
    }

    return { tex, alpha, color, geomType };
}

// Shared ThreeJS reusable meshes
const geomCube = new THREE.BoxGeometry(1, 1, 1);
const geomSlabBottom = new THREE.BoxGeometry(1, 0.5, 1).translate(0, -0.25, 0);
const geomSlabTop = new THREE.BoxGeometry(1, 0.5, 1).translate(0, 0.25, 0);
const geomChest = new THREE.BoxGeometry(0.85, 0.85, 0.85);
const geomPlate = new THREE.BoxGeometry(1, 0.06, 1).translate(0, -0.47, 0);
const geomFence = new THREE.BoxGeometry(0.25, 1, 0.25);
const geomPaneX = new THREE.BoxGeometry(1, 1, 0.06);

// Billboard Cross Geometries
const geomRail = new THREE.BoxGeometry(1, 0.1, 0.1); // Simple rail placeholder

const vertsCross = new Float32Array([
    -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
    -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5,
    -0.5, -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5,
    -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5,
]);
const uvsCross = new Float32Array([
    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,
    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1
]);
const normalsCross = new Float32Array(24).fill(0);
geomCross.setAttribute('position', new THREE.BufferAttribute(vertsCross, 3));
geomCross.setAttribute('uv', new THREE.BufferAttribute(uvsCross, 2));
geomCross.setAttribute('normal', new THREE.BufferAttribute(normalsCross, 3));

// Intersecting structural glass panes / iron bars
const geomPaneCross = new THREE.BufferGeometry();
const vertsPane = new Float32Array([
    -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0,
    -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0,
    0, -0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, -0.5,
    0, -0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5
]);
const uvsPane = new Float32Array([
    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,
    0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1
]);
const normalsPane = new Float32Array(24).fill(0);
geomPaneCross.setAttribute('position', new THREE.BufferAttribute(vertsPane, 3));
geomPaneCross.setAttribute('uv', new THREE.BufferAttribute(uvsPane, 2));
geomPaneCross.setAttribute('normal', new THREE.BufferAttribute(normalsPane, 3));

const baseStairPart = new THREE.BoxGeometry(1, 0.5, 1).translate(0, -0.25, 0);
const topStairPart = new THREE.BoxGeometry(1, 0.5, 0.5).translate(0, 0.25, 0.25);
const geomStairs = BufferGeometryUtils.mergeGeometries([baseStairPart, topStairPart]);

function getGeometryForType(geomType) {
    switch (geomType) {
        case 'SLAB_BOTTOM':
            return geomSlabBottom;
        case 'SLAB_TOP':
            return geomSlabTop;
        case 'CHEST':
            return geomChest;
        case 'PLATE':
            return geomPlate;
        case 'FENCE':
            return geomFence;
        case 'PANE':
            return geomPaneX;
        case 'PANE_CROSS':
            return geomPaneCross;
        case 'CROSS':
            return geomCross;
        case 'RAIL':
            return geomRail;
        case 'STAIRS':
            return geomStairs;
        default:
            return geomCube;
    }
}

// ── Form & Preview WebGL Setup ──
let activeSchematicData = null;
let previewScene, previewCamera, previewRenderer, previewControls, previewGroup = null;
let animationFrameId = null;

const uploadDragZone = document.getElementById('uploadDragZone');
const schemFileInput = document.getElementById('schemFileInput');
const viewportContainer = document.getElementById('modal-viewport-container');
const confirmUploadBtn = document.getElementById('confirmUploadBtn');

uploadDragZone.addEventListener('click', () => schemFileInput.click());
uploadDragZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadDragZone.classList.add('dragover'); });
uploadDragZone.addEventListener('dragleave', () => uploadDragZone.classList.remove('dragover'));
uploadDragZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDragZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFileSelected(e.dataTransfer.files[0]);
});
schemFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFileSelected(e.target.files[0]);
});

function handleFileSelected(file) {
    if (!file.name.endsWith('.aschem')) {
        alert("Please select a valid .aschem file.");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target.result;
            const jsonString = text.split('\n').slice(1).join('\n');
            activeSchematicData = JSON.parse(jsonString);

            // Auto-fill form inputs
            document.getElementById('schemNameInput').value = activeSchematicData.name || file.name.replace('.aschem', '');
            document.getElementById('schemAuthorInput').value = "BarneyTheGod"; // Default community creator

            // Show live WebGL viewport inside form
            uploadDragZone.style.display = 'none';
            viewportContainer.style.display = 'block';
            confirmUploadBtn.removeAttribute('disabled');

            initPreviewViewport();
            renderSchematicToViewport(activeSchematicData);

        } catch (err) {
            console.error(err);
            alert("Error parsing .aschem file structural data.");
        }
    };
    reader.readAsText(file);
}

function initPreviewViewport() {
    // Clean up existing setup
    if (previewRenderer) {
        cancelAnimationFrame(animationFrameId);
        viewportContainer.removeChild(previewRenderer.domElement);
        previewRenderer.dispose();
    }

    previewScene = new THREE.Scene();
    previewScene.background = new THREE.Color(0x111827);

    previewCamera = new THREE.PerspectiveCamera(50, viewportContainer.clientWidth / viewportContainer.clientHeight, 0.1, 1000);
    previewRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    previewRenderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight);
    previewRenderer.setPixelRatio(window.devicePixelRatio);
    viewportContainer.appendChild(previewRenderer.domElement);

    previewControls = new OrbitControls(previewCamera, previewRenderer.domElement);
    previewControls.enableDamping = true;
    previewControls.dampingFactor = 0.05;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    previewScene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.65);
    directional.position.set(10, 20, 10);
    previewScene.add(directional);

    function animateViewport() {
        animationFrameId = requestAnimationFrame(animateViewport);
        previewControls.update();
        previewRenderer.render(previewScene, previewCamera);
    }
    animateViewport();
}

function renderSchematicToViewport(data) {
    if (previewGroup) previewScene.remove(previewGroup);
    previewGroup = new THREE.Group();

    const w = data.width;
    const h = data.height;
    const l = data.length;
    const blocks = data.blocks;

    const blocksByPacked = {};
    let blockCount = 0;

    for (let y = 0; y < h; y++) {
        for (let z = 0; z < l; z++) {
            for (let x = 0; x < w; x++) {
                const index = (y * l + z) * w + x;
                const packed = blocks[index];
                if (packed === 0) continue;

                if (!blocksByPacked[packed]) blocksByPacked[packed] = [];
                blocksByPacked[packed].push({ x, y, z });
                blockCount++;
            }
        }
    }

    const dummy = new THREE.Object3D();

    for (const [packedStr, positions] of Object.entries(blocksByPacked)) {
        const packed = parseInt(packedStr);
        const id = packed >> 4;
        const meta = packed & 0xF;

        const info = getBlockMaterial(id, meta);
        const activeGeometry = getGeometryForType(info.geomType);

        let material;
        if (info.tex) {
            if (!loadedTextures[info.tex]) {
                const tex = textureLoader.load(TEXTURE_BASE_URL + info.tex);
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                tex.colorSpace = THREE.SRGBColorSpace;
                loadedTextures[info.tex] = tex;
            }
            material = new THREE.MeshLambertMaterial({
                map: loadedTextures[info.tex],
                transparent: info.alpha,
                alphaTest: info.alpha ? 0.35 : 0,
                side: THREE.DoubleSide
            });
        } else {
            material = new THREE.MeshLambertMaterial({ color: info.color });
        }

        const mesh = new THREE.InstancedMesh(activeGeometry, material, positions.length);

        positions.forEach((pos, i) => {
            dummy.position.set(pos.x, pos.y, pos.z);
            dummy.rotation.set(0, 0, 0);

            // Orientation setups
            if (info.geomType === 'STAIRS') {
                const isUpsideDown = (meta & 4) !== 0;
                const direction = meta & 3;
                // Minecraft stair orientation: 0=east, 1=west, 2=south, 3=north
                let rotY = 0;
                switch(direction) {
                    case 0: rotY = 0; break; // east
                    case 1: rotY = Math.PI; break; // west
                    case 2: rotY = Math.PI / 2; break; // south
                    case 3: rotY = -Math.PI / 2; break; // north
                }
                dummy.rotation.y = rotY;
                if (isUpsideDown) dummy.rotation.x = Math.PI;

            } else if (id === 17) {
                const direction = meta & 12;
                if (direction === 4) dummy.rotation.z = Math.PI / 2;
                else if (direction === 8) dummy.rotation.x = Math.PI / 2;
            } else if (info.geomType === 'CROSS' && id === 50) {
                const wallDir = meta;
                if (wallDir === 1) { dummy.position.x += 0.25; dummy.position.y += 0.125; dummy.rotation.z = -0.32; }
                else if (wallDir === 2) { dummy.position.x -= 0.25; dummy.position.y += 0.125; dummy.rotation.z = 0.32; }
                else if (wallDir === 3) { dummy.position.z += 0.25; dummy.position.y += 0.125; dummy.rotation.x = 0.32; }
                else if (wallDir === 4) { dummy.position.z -= 0.25; dummy.position.y += 0.125; dummy.rotation.x = -0.32; }
            }

            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        });

        mesh.instanceMatrix.needsUpdate = true;
        previewGroup.add(mesh);
    }

    // Central Alignment Offset
    previewGroup.position.set(-w / 2, -h / 2, -l / 2);
    previewScene.add(previewGroup);

    // Auto-align camera
    const maxDim = Math.max(w, h, l);
    previewCamera.position.set(maxDim * 1.1, maxDim * 0.9, maxDim * 1.1);
    previewControls.target.set(0, 0, 0);
    previewControls.update();
}

// Publish confirming trigger (Renders safely to thumbnail base64 offline)
confirmUploadBtn.addEventListener('click', () => {
    if (!activeSchematicData || !previewRenderer) return;

    // Align camera perfectly for standard isometric snap shot
    const bbox = new THREE.Box3().setFromObject(previewGroup);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    bbox.getCenter(center);
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const offsetDist = maxDim * 1.05;

    previewCamera.position.set(center.x + offsetDist, center.y + offsetDist * 0.75, center.z + offsetDist);
    previewControls.target.copy(center);
    previewControls.update();

    // Clear buffer & snap
    previewRenderer.render(previewScene, previewCamera);
    const safeThumbnailBase64 = previewRenderer.domElement.toDataURL('image/png');

    const customName = document.getElementById('schemNameInput').value.trim() || "Amazing Build";
    const customAuthor = document.getElementById('schemAuthorInput').value.trim() || "BarneyTheGod";

    // Count block types
    const cleanBlocks = activeSchematicData.blocks.filter(b => b !== 0);

    const fileBlob = new Blob(["ASTRA_SCHEM_V1\n" + JSON.stringify(activeSchematicData)], { type: "text/plain" });

    // Upload to Google Apps Script Endpoint
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbx-3dP3miUUXjTsmKf5LmrMPBRTUKbhCDffQJdA3ns6VqGxJmBViFTrlcptdGPiVGr-/exec';
    const reader = new FileReader();

    confirmUploadBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Uploading...';
    confirmUploadBtn.disabled = true;

    reader.readAsDataURL(fileBlob);
    reader.onloadend = async function () {
        const base64data = reader.result;

        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify({
                    filename: customName.toLowerCase().replace(/\s+/g, '_') + ".aschem",
                    file: base64data,
                    author: customAuthor,
                    blocks: cleanBlocks.length,
                    thumbnail: safeThumbnailBase64
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                appendSchematicCard({
                    name: customName,
                    author: customAuthor,
                    blocks: cleanBlocks.length,
                    downloadUrl: result.fileUrl,
                    imgSrc: safeThumbnailBase64,
                    fileName: customName.toLowerCase().replace(/\s+/g, '_') + ".aschem"
                });
                alert('Upload successful!');
                closeUploadModal();
            } else {
                throw new Error("Upload failed.");
            }
        } catch (e) {
            console.error(e);
            // Fallback to local mock for testing if no URL provided
            const mockUrl = URL.createObjectURL(fileBlob);
            appendSchematicCard({
                name: customName,
                author: customAuthor,
                blocks: cleanBlocks.length,
                downloadUrl: mockUrl,
                imgSrc: safeThumbnailBase64,
                fileName: customName.toLowerCase().replace(/\s+/g, '_') + ".aschem"
            });
            closeUploadModal();
        }

        confirmUploadBtn.innerHTML = 'Upload';
        confirmUploadBtn.disabled = false;
    }
});

function resetUploadForm() {
    activeSchematicData = null;
    document.getElementById('schemNameInput').value = "";
    document.getElementById('schemAuthorInput').value = "";
    uploadDragZone.style.display = 'flex';
    viewportContainer.style.display = 'none';
    confirmUploadBtn.setAttribute('disabled', 'true');
    if (previewRenderer) {
        cancelAnimationFrame(animationFrameId);
        viewportContainer.innerHTML = '<div class="viewport-badge">Live interactive snapshot render</div>';
        previewRenderer.dispose();
        previewRenderer = null;
    }
}

function appendSchematicCard(schem) {
    const grid = document.getElementById('schematicGrid');
    const card = document.createElement('div');
    card.className = 'schematic-card reveal visible';
    card.innerHTML = `
                <div class="schematic-preview-box">
                    <img src="${schem.imgSrc}" alt="${schem.name}">
                </div>
                <div class="schematic-info">
                    <div class="schematic-meta">
                        <div class="schematic-title">${schem.name}</div>
                        <div class="schematic-author">BY ${schem.author}</div>
                    </div>
                    <div class="schematic-footer-bar">
                        <div class="schematic-stats">${schem.blocks.toLocaleString()} Blocks</div>
                        <a href="${schem.downloadUrl}" download="${schem.fileName}" class="btn-download-schem" title="Download Schematic">
                            <i class="bx bx-download"></i>
                        </a>
                    </div>
                </div>
            `;
    grid.insertBefore(card, grid.firstChild);
}

// ── Preset Schematics Pre-Population ──
// 1. "Small House" directly loaded using your uploaded 'small house.aschem' logic
const rawSmallHouseAschem = { "blocks": [0, 0, 48, 0, 0, 0, 48, 0, 0, 0, 48, 0, 0, 0, 32, 0, 0, 0, 0, 48, 0, 0, 0, 48, 0, 0, 0, 48, 0, 0, 0, 32, 0, 0, 48, 48, 48, 48, 48, 48, 272, 48, 48, 48, 272, 48, 48, 48, 48, 48, 32, 0, 0, 48, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 48, 0, 0, 0, 0, 48, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 1571, 1571, 0, 0, 0, 48, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 48, 0, 0, 32, 48, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 48, 32, 0, 0, 48, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 48, 0, 0, 0, 0, 48, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 1571, 1571, 0, 0, 0, 48, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 272, 48, 0, 0, 48, 48, 48, 48, 48, 48, 272, 48, 48, 48, 272, 48, 48, 48, 48, 32, 32, 0, 0, 48, 0, 0, 0, 48, 0, 0, 0, 48, 0, 0, 0, 32, 0, 0, 0, 0, 48, 0, 0, 0, 48, 0, 0, 0, 32, 0, 0, 0, 32, 0, 0, 0, 0, 1074, 0, 0, 0, 1074, 0, 0, 0, 1074, 0, 0, 0, 1074, 0, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 1072, 64, 272, 688, 688, 688, 0, 688, 688, 688, 0, 688, 688, 688, 272, 64, 1073, 0, 0, 688, 869, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 688, 0, 0, 0, 0, 688, 869, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1120, 1026, 1152, 0, 0, 0, 688, 272, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 688, 0, 0, 1072, 64, 0, 272, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 1073, 0, 0, 688, 272, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 688, 0, 0, 0, 0, 688, 851, 272, 0, 0, 0, 0, 0, 0, 0, 0, 1120, 1026, 1152, 0, 0, 0, 688, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 688, 0, 0, 1072, 64, 272, 688, 688, 688, 0, 688, 688, 688, 0, 688, 688, 688, 272, 64, 1073, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 0, 1075, 0, 0, 0, 1075, 0, 0, 0, 1075, 0, 0, 0, 1075, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 272, 16, 1632, 16, 0, 16, 1632, 16, 0, 16, 1632, 16, 272, 64, 0, 0, 0, 16, 801, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1032, 0, 0, 0, 0, 16, 272, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 64, 276, 272, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 16, 851, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 1632, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1032, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 64, 272, 16, 1632, 16, 804, 16, 1632, 16, 804, 16, 1632, 16, 272, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 272, 16, 1632, 16, 0, 16, 1632, 16, 0, 16, 1632, 16, 272, 64, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 0, 0, 0, 0, 16, 272, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 64, 272, 851, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 16, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 1632, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 64, 272, 16, 1632, 16, 0, 16, 1632, 16, 0, 16, 1632, 16, 272, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1078, 0, 0, 0, 1078, 0, 0, 0, 1078, 0, 0, 0, 1078, 0, 0, 0, 1078, 64, 1078, 0, 1076, 64, 1077, 0, 1076, 64, 1077, 0, 1076, 64, 1077, 0, 1076, 64, 272, 276, 276, 276, 272, 276, 276, 276, 272, 276, 276, 276, 272, 64, 1077, 0, 1079, 280, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 280, 1079, 0, 0, 0, 280, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 280, 0, 0, 0, 1078, 280, 851, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 280, 1078, 0, 1076, 64, 272, 0, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 272, 64, 1077, 0, 1079, 280, 0, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 280, 1079, 0, 0, 0, 280, 0, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 280, 0, 0, 0, 1078, 280, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 280, 1078, 0, 1076, 64, 272, 276, 276, 276, 272, 276, 276, 276, 272, 276, 276, 276, 272, 64, 1077, 0, 1076, 64, 1077, 0, 1076, 64, 1077, 0, 1076, 64, 1077, 0, 1076, 64, 1077, 0, 0, 0, 1079, 0, 0, 0, 1079, 0, 0, 0, 1079, 0, 0, 0, 1079, 0, 0, 0, 2180, 272, 2181, 2027, 2180, 272, 2181, 2027, 2180, 272, 2181, 2027, 2180, 272, 2181, 0, 2182, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 2182, 2176, 64, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 64, 2177, 2183, 64, 280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 280, 64, 2183, 2027, 64, 280, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 280, 64, 2027, 2182, 64, 280, 0, 1360, 0, 0, 0, 0, 0, 0, 0, 0, 0, 280, 64, 2182, 2176, 64, 272, 0, 1360, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 64, 2177, 2183, 64, 280, 0, 1360, 0, 0, 0, 0, 0, 0, 0, 0, 0, 280, 64, 2183, 2027, 64, 280, 0, 1360, 0, 0, 0, 0, 0, 0, 0, 0, 0, 280, 64, 2027, 2182, 64, 280, 1360, 1360, 0, 0, 0, 0, 272, 272, 272, 272, 272, 280, 64, 2182, 2176, 64, 272, 0, 0, 0, 0, 0, 0, 0, 848, 272, 272, 272, 272, 64, 2177, 2183, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 2183, 0, 2180, 272, 2181, 2027, 2180, 272, 2181, 2027, 2180, 272, 2181, 2027, 2180, 272, 2181, 0, 0, 2019, 280, 276, 276, 276, 280, 276, 276, 276, 280, 276, 276, 276, 280, 2019, 0, 0, 2019, 688, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 688, 2019, 0, 0, 2176, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 2177, 0, 0, 2019, 688, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 688, 2019, 0, 0, 2019, 688, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 688, 2019, 0, 0, 2019, 688, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 688, 2019, 0, 0, 2176, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 2177, 0, 0, 2019, 688, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 688, 2019, 0, 0, 2019, 688, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 688, 2019, 0, 0, 2019, 688, 0, 0, 0, 0, 0, 0, 0, 272, 272, 272, 272, 688, 2019, 0, 0, 2176, 272, 0, 0, 0, 0, 0, 0, 0, 0, 848, 272, 272, 272, 2177, 0, 0, 2019, 688, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 272, 688, 2019, 0, 0, 2019, 280, 276, 276, 276, 280, 276, 276, 276, 280, 276, 276, 276, 280, 2019, 0, 0, 0, 272, 560, 1632, 560, 272, 560, 1632, 560, 272, 560, 1632, 560, 272, 0, 0, 0, 0, 560, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 560, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 560, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 560, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 560, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 560, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 560, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 560, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 560, 0, 0, 0, 0, 0, 0, 0, 0, 272, 272, 272, 560, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 848, 272, 272, 0, 0, 0, 0, 560, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 560, 0, 0, 0, 0, 272, 560, 1632, 560, 272, 560, 1632, 560, 272, 560, 1632, 560, 272, 0, 0, 0, 0, 272, 560, 1632, 560, 272, 560, 1632, 560, 272, 560, 1632, 560, 272, 0, 0, 0, 0, 560, 0, 0, 0, 803, 0, 0, 0, 803, 0, 0, 0, 560, 0, 0, 0, 0, 272, 801, 0, 0, 0, 0, 0, 0, 0, 0, 0, 802, 272, 0, 0, 0, 0, 560, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 560, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 560, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 560, 0, 0, 0, 0, 272, 801, 0, 0, 0, 0, 0, 0, 0, 0, 0, 802, 272, 0, 0, 0, 0, 560, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 560, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 560, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 851, 560, 0, 0, 0, 0, 272, 801, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 560, 0, 0, 0, 804, 0, 0, 0, 804, 0, 0, 272, 560, 0, 0, 0, 0, 272, 560, 1632, 560, 272, 560, 1632, 560, 272, 560, 1632, 560, 272, 0, 0, 0, 0, 2019, 83, 560, 83, 560, 83, 560, 83, 560, 83, 560, 83, 2019, 0, 0, 0, 0, 2003, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 83, 0, 0, 0, 0, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 0, 0, 0, 0, 280, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 280, 0, 0, 0, 0, 280, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 280, 0, 0, 0, 0, 280, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 280, 0, 0, 0, 0, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 0, 0, 0, 0, 280, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 280, 0, 0, 0, 0, 280, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 851, 280, 0, 0, 0, 0, 280, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 0, 280, 0, 0, 0, 0, 276, 276, 276, 276, 276, 276, 276, 276, 276, 0, 0, 0, 276, 0, 0, 0, 0, 2003, 276, 276, 276, 276, 276, 276, 276, 276, 276, 276, 272, 2003, 0, 0, 0, 0, 2019, 83, 560, 83, 560, 83, 560, 83, 560, 83, 560, 83, 2019, 0, 0, 0, 0, 0, 2178, 272, 2178, 272, 2178, 272, 2178, 272, 2178, 272, 2178, 0, 0, 0, 0, 0, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 0, 0, 0, 0, 83, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2003, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1360, 0, 272, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 1360, 1360, 1360, 0, 272, 0, 0, 0, 0, 83, 0, 0, 0, 0, 0, 0, 0, 1360, 0, 0, 0, 2003, 0, 0, 0, 0, 2003, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 0, 0, 0, 0, 0, 2179, 272, 2179, 272, 2179, 272, 2179, 272, 2179, 272, 2179, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 0, 0, 0, 0, 83, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2003, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1632, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 83, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2003, 0, 0, 0, 0, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 0, 0, 0, 0, 83, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2003, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 272, 801, 0, 0, 0, 0, 0, 0, 0, 0, 0, 802, 272, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 83, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2003, 0, 0, 0, 0, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 0, 0, 0, 0, 83, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2003, 0, 0, 0, 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 272, 0, 0, 0, 0, 83, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2003, 0, 0, 0, 0, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 2178, 0, 0, 0, 0, 2003, 2003, 2003, 2003, 2003, 2003, 2003, 2003, 2003, 2003, 2003, 2003, 2003, 0, 0, 0, 0, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 2179, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "length": 13, "width": 17, "v": 1, "height": 16, "name": "small house" };

function compilePresetThumbnail(data, callback) {
    const tempContainer = document.createElement('div');
    tempContainer.style.width = '400px';
    tempContainer.style.height = '300px';
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    document.body.appendChild(tempContainer);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    const camera = new THREE.PerspectiveCamera(50, 4 / 3, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(400, 300);
    tempContainer.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(20, 35, 20);
    scene.add(directional);

    const group = new THREE.Group();
    const w = data.width;
    const h = data.height;
    const l = data.length;
    const blocks = data.blocks;

    const blocksByPacked = {};
    for (let y = 0; y < h; y++) {
        for (let z = 0; z < l; z++) {
            for (let x = 0; x < w; x++) {
                const index = (y * l + z) * w + x;
                const packed = blocks[index];
                if (packed === 0) continue;
                if (!blocksByPacked[packed]) blocksByPacked[packed] = [];
                blocksByPacked[packed].push({ x, y, z });
            }
        }
    }

    const dummy = new THREE.Object3D();
    let loadedCount = 0;
    const totalKeys = Object.keys(blocksByPacked).length;

    if (totalKeys === 0) {
        cleanup();
        return;
    }

    for (const [packedStr, positions] of Object.entries(blocksByPacked)) {
        const packed = parseInt(packedStr);
        const id = packed >> 4;
        const meta = packed & 0xF;

        const info = getBlockMaterial(id, meta);
        const activeGeometry = getGeometryForType(info.geomType);

        let material;
        if (info.tex) {
            const textureUrl = TEXTURE_BASE_URL + info.tex;
            const onTextureLoad = (tex) => {
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                tex.colorSpace = THREE.SRGBColorSpace;

                material = new THREE.MeshLambertMaterial({
                    map: tex,
                    transparent: info.alpha,
                    alphaTest: info.alpha ? 0.35 : 0,
                    side: THREE.DoubleSide
                });
                createInstances();
            };

            if (loadedTextures[info.tex]) {
                onTextureLoad(loadedTextures[info.tex]);
            } else {
                textureLoader.load(textureUrl, (tex) => {
                    loadedTextures[info.tex] = tex;
                    onTextureLoad(tex);
                }, null, () => {
                    // On Texture error, use procedural fallback
                    material = new THREE.MeshLambertMaterial({ color: info.color });
                    createInstances();
                });
            }
        } else {
            material = new THREE.MeshLambertMaterial({ color: info.color });
            createInstances();
        }

        function createInstances() {
            const mesh = new THREE.InstancedMesh(activeGeometry, material, positions.length);
            positions.forEach((pos, i) => {
                dummy.position.set(pos.x, pos.y, pos.z);
                dummy.rotation.set(0, 0, 0);

                if (info.geomType === 'STAIRS') {
                    const isUpsideDown = (meta & 4) !== 0;
                    const direction = meta & 3;
                    if (isUpsideDown) dummy.rotation.x = Math.PI;
                    if (direction === 0) dummy.rotation.y = -Math.PI / 2;
                    else if (direction === 1) dummy.rotation.y = Math.PI / 2;
                    else if (direction === 2) dummy.rotation.y = Math.PI;
                } else if (id === 17) {
                    const direction = meta & 12;
                    if (direction === 4) dummy.rotation.z = Math.PI / 2;
                    else if (direction === 8) dummy.rotation.x = Math.PI / 2;
                } else if (info.geomType === 'CROSS' && id === 50) {
                    const wallDir = meta;
                    if (wallDir === 1) { dummy.position.x += 0.25; dummy.position.y += 0.125; dummy.rotation.z = -0.32; }
                    else if (wallDir === 2) { dummy.position.x -= 0.25; dummy.position.y += 0.125; dummy.rotation.z = 0.32; }
                    else if (wallDir === 3) { dummy.position.z += 0.25; dummy.position.y += 0.125; dummy.rotation.x = 0.32; }
                    else if (wallDir === 4) { dummy.position.z -= 0.25; dummy.position.y += 0.125; dummy.rotation.x = -0.32; }
                }

                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            });
            mesh.instanceMatrix.needsUpdate = true;
            group.add(mesh);

            loadedCount++;
            if (loadedCount === totalKeys) {
                snapAndFinish();
            }
        }
    }

    function snapAndFinish() {
        group.position.set(-w / 2, -h / 2, -l / 2);
        scene.add(group);

        const bbox = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        bbox.getCenter(center);
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const offsetDist = maxDim * 1.05;

        camera.position.set(center.x + offsetDist, center.y + offsetDist * 0.75, center.z + offsetDist);
        camera.lookAt(center);

        // Wait slightly for texture rendering to settle, then capture
        setTimeout(() => {
            renderer.render(scene, camera);
            const base64Img = renderer.domElement.toDataURL('image/png');
            cleanup();
            callback(base64Img);
        }, 150);
    }

    function cleanup() {
        renderer.dispose();
        document.body.removeChild(tempContainer);
    }
}

// Initialize the Schematic Grid with Preloads on load
window.addEventListener('DOMContentLoaded', () => {
    // Dynamically load schematics here in the future
});