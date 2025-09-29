function openLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function openRegisterModal() {
    document.getElementById('registerModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function handleLogin(event) {
    event.preventDefault();
    // Simulasi login - bisa diganti dengan API call
    enterApp();
}

function handleRegister(event) {
    event.preventDefault();
    // Simulasi register - bisa diganti dengan API call
    enterApp();
}

function enterAsGuest() {
    closeModal('loginModal');
    enterApp();
}

function enterApp() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    initializeApp();
}

function scrollToFeatures() {
    document.getElementById('featuresSection').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// ============================================
// ORIGINAL APP FUNCTIONS
// ============================================

let latestPrediction = null;
let stream = null;
let currentImageURL = '';
let cartItems = {};
const checkoutMinPrice = 50000;

let stats = {
    totalAnalysis: 0,
    acceptedItems: 0,
    rejectedItems: 0,
    totalEarnings: 0
};
let transactionHistory = [];

const wastePrice = {
    'plastic': { price: 3000, icon: '🥤', name: 'Plastik', recyclable: true },
    'cardboard': { price: 2500, icon: '📦', name: 'Kardus', recyclable: true },
    'paper': { price: 2000, icon: '📄', name: 'Kertas', recyclable: true },
    'metal': { price: 8000, icon: '🔩', name: 'Logam', recyclable: true },
    'brown-glass': { price: 1500, icon: '🍾', name: 'Botol Kaca Coklat', recyclable: true },
    'green-glass': { price: 1500, icon: '🍾', name: 'Botol Kaca Hijau', recyclable: true },
    'white-glass': { price: 1500, icon: '🍾', name: 'Botol Kaca Putih', recyclable: true },
    'battery': { price: 5000, icon: '🔋', name: 'Baterai', recyclable: true },
    'clothes': { price: 1000, icon: '👕', name: 'Pakaian', recyclable: true },
    'shoes': { price: 500, icon: '👟', name: 'Sepatu', recyclable: true },
    'biological': { price: 0, icon: '🍂', name: 'Sampah Biologis', recyclable: false },
    'trash': { price: 0, icon: '🗑', name: 'Sampah Umum', recyclable: false }
};

// DOM Elements
const fileInput = document.getElementById("fileInput");
const imagePreview = document.getElementById("imagePreview");
const previewText = document.getElementById("previewText");
const predictBtn = document.getElementById("predictBtn");
const resultDiv = document.getElementById("result");
const cartList = document.getElementById("cartList");
const checkoutBtn = document.getElementById("checkoutBtn");
const emptyCartMsg = document.getElementById("emptyCartMsg");
const checkoutResultDiv = document.getElementById("checkoutResult");
const uploadZone = document.getElementById('uploadZone');
const previewSection = document.getElementById('previewSection');
const loadingSection = document.getElementById('loadingSection');
const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const cameraPreviewSection = document.getElementById("cameraPreviewSection");
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const uploadAgainBtn = document.getElementById('uploadAgainBtn');
const chooseFileBtn = document.getElementById('chooseFileBtn');
const totalAnalysisElement = document.getElementById('totalAnalysis');
const acceptedItemsElement = document.getElementById('acceptedItems');
const rejectedItemsElement = document.getElementById('rejectedItems');
const totalEarningsElement = document.getElementById('totalEarnings');
const captureBtnCamera = document.getElementById('captureBtnCamera');

// Event Listeners
document.getElementById('burgerIcon').addEventListener('click', () => toggleSidebar('sidebar'));
document.getElementById('cartIcon').addEventListener('click', () => toggleSidebar('cartSidebar'));

checkoutBtn.addEventListener('click', checkout);
predictBtn.addEventListener('click', predict);

uploadZone.addEventListener('dragover', (e) => { 
    e.preventDefault(); 
    uploadZone.classList.add('dragover'); 
});

uploadZone.addEventListener('dragleave', () => { 
    uploadZone.classList.remove('dragover'); 
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
});

uploadZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => { 
    if (e.target.files.length > 0) handleFile(e.target.files[0]); 
});

function toggleSidebar(id) {
    const sidebar = document.getElementById(id);
    sidebar.classList.toggle('active');
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tabName}-tab-btn`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');
    
    if (stream) {
        closeCamera();
    }
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Harap pilih file gambar yang valid!', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran file terlalu besar! Maksimal 5MB.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageURL = e.target.result;
        imagePreview.src = currentImageURL;
        imagePreview.classList.remove('hidden');
        previewText.classList.add('hidden');
        previewSection.style.display = 'block';
        predictBtn.disabled = false;
        resultDiv.classList.add('hidden');
        uploadZone.classList.add('hidden');
        uploadAgainBtn.classList.remove('hidden');
        predictBtn.classList.remove('hidden');
        showToast('Gambar berhasil diunggah! Klik Analisis untuk memulai.', 'success');
        
        if (stream) {
            closeCamera();
        }
    };
    reader.readAsDataURL(file);
}

async function toggleCamera() {
    const captureBtn = document.getElementById('captureBtnCamera');

    try {
        captureBtn.disabled = true;
        captureBtn.innerHTML = '⏳ Memuat Kamera...';

        uploadZone.classList.add('hidden');
        cameraPreviewSection.style.display = 'block';
        previewSection.style.display = 'none';
        
        if (stream) {
            closeCamera();
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Browser tidak mendukung akses kamera');
        }
        
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'environment'
            },
            audio: false
        });
        
        videoElement.srcObject = stream;
        
        videoElement.addEventListener('loadedmetadata', () => {
            videoElement.play().catch(err => {
                console.error('Error playing video:', err);
            });
            captureBtn.disabled = false;
            captureBtn.innerHTML = '📸 Ambil Gambar';
            showToast('Kamera siap! Silakan ambil gambar.', 'success');
        });
        
    } catch (err) {
        console.error("Error accessing camera: ", err);
        
        let errorMessage = "Tidak dapat mengakses kamera. ";
        
        if (err.name === 'NotAllowedError') {
            errorMessage += "Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.";
        } else if (err.name === 'NotFoundError') {
            errorMessage += "Kamera tidak ditemukan. Pastikan kamera terpasang dengan benar.";
        } else if (err.name === 'AbortError' || err.message.toLowerCase().includes('timeout')) {
            errorMessage = "Kamera terlalu lama merespon. Pastikan tidak ada aplikasi lain yang menggunakan kamera dan coba lagi.";
        } else {
            errorMessage += `Error: ${err.message}`;
        }
        
        showToast(errorMessage, 'error');
        closeCamera();
        captureBtn.disabled = false;
        captureBtn.innerHTML = '📸 Ambil Gambar';
    }
}

function requestCameraPermission() {
    if (typeof navigator.permissions !== 'undefined') {
        navigator.permissions.query({ name: 'camera' })
            .then(permissionStatus => {
                console.log('Camera permission state:', permissionStatus.state);
                
                permissionStatus.onchange = () => {
                    console.log('Camera permission changed to:', permissionStatus.state);
                };
            })
            .catch(err => {
                console.error('Error checking camera permission:', err);
            });
    }
}

function captureFromCamera() {
    if (!stream || !videoElement.videoWidth || !videoElement.videoHeight) {
        showToast('Kamera belum siap. Mohon tunggu sebentar.', 'error');
        return;
    }

    try {
        const ctx = canvasElement.getContext('2d');
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight);

        canvasElement.toBlob(blob => {
            if (!blob) {
                showToast('Gagal mengambil gambar dari kamera.', 'error');
                return;
            }
            
            const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            closeCamera();
            handleFile(file);
            
        }, 'image/jpeg', 0.8);

    } catch (error) {
        console.error('Error capturing image:', error);
        showToast('Gagal mengambil gambar: ' + error.message, 'error');
    }
}

function closeCamera() {
    if (stream) {
        try {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        } catch (error) {
            console.error('Error stopping camera tracks:', error);
        }
        stream = null;
    }
    cameraPreviewSection.style.display = 'none';
    uploadZone.classList.remove('hidden');
    videoElement.srcObject = null;
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden && stream) {
        closeCamera();
        showToast('Kamera dihentikan karena tab tidak aktif', 'info');
    }
});

function initializeApp() {
    updateCart({});
    updateStats();
    updateHistoryList();
    resetUpload();
    requestCameraPermission();
}

async function predict() {
    if (!fileInput.files[0]) {
        showToast("Pilih gambar terlebih dahulu!", 'error');
        return;
    }
    toggleButtonLoading(predictBtn, true);
    loadingSection.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
        const res = await fetch("/predict", { method: "POST", body: formData });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        latestPrediction = data;
        displayResult(data.class.toLowerCase().replace('-', '_'), { recyclable: data.status === 'Recyclable', confidence: data.confidence });
    } catch (error) {
        resultDiv.innerHTML = `<p class="text-red-600">Gagal melakukan prediksi. Coba lagi. <br><small>${error.message}</small></p>`;
        resultDiv.classList.remove('hidden');
        showToast(`Gagal menganalisis: ${error.message}`, 'error');
    } finally {
        toggleButtonLoading(predictBtn, false, '🔍 Analisis & Validasi');
        loadingSection.classList.add('hidden');
    }
}

function toggleButtonLoading(button, isLoading, defaultText) {
    const loader = button.querySelector('.loader');
    const textSpan = button.querySelector('span');

    if (isLoading) {
        button.disabled = true;
        if (loader) loader.classList.remove('hidden');
        if (textSpan) textSpan.classList.add('hidden');
    } else {
        button.disabled = false;
        if (loader) loader.classList.add('hidden');
        if (textSpan) {
            if (defaultText) textSpan.textContent = defaultText;
            textSpan.classList.remove('hidden');
        }
    }
}

function displayResult(wasteType, result) {
    const isAccepted = result.recyclable;
    const priceInfo = wastePrice[wasteType] || { price: 0, icon: '♻', name: 'Sampah Tidak Dikenal' };
    
    const confidence = result.confidence;
    const isHighConfidence = confidence >= 0.75;
    
    latestPrediction = {
        class: priceInfo.name,
        price: priceInfo.price,
        wasteTypeKey: wasteType
    };

    let content = `
        <div class="result-card ${isHighConfidence ? 'accepted' : 'rejected'}">
            <div class="waste-type">
                <div class="status-icon">${isHighConfidence ? '✅' : '❌'}</div>
                <div>
                    <div>${priceInfo.icon} ${priceInfo.name}</div>
                    <div style="font-size: 1rem; font-weight: normal; color: #6c757d; margin-top: 5px;">
                        ${isHighConfidence ? 'Dapat didaur ulang' : 'Tidak dapat didaur ulang'}
                    </div>
                </div>
            </div>
            <div class="confidence">
                🎯 Confidence: ${(confidence * 100).toFixed(1)}%
            </div>
    `;

    if (isHighConfidence) {
        content += `
            <div class="price-section">
                <div id="inputContainer" style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <div class="price-input-group">
                        <label for="waste-qty-input" style="font-weight: bold;">Masukkan berat sampah (kg):</label>
                        <input type="number" id="waste-qty-input" min="0.1" max="100" step="0.1" placeholder="Contoh: 3.5" 
                                style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; width: 150px; text-align: center;"
                                value="">
                    </div>
                    <p class="price-estimate-text" id="priceEstimateText">Estimasi: Rp 0</p>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                        <button class="btn btn-success" id="addToCartBtn" disabled>
                            ➕ Tambahkan ke Keranjang
                        </button>
                        <button class="btn" onclick="resetUpload()">
                            📸 Unggah Gambar Lain
                        </button>
                    </div>
                </div>
                <div id="postAddContainer" class="post-add-container">
                    <div class="checkmark-icon">✅</div>
                    <p class="price-estimate-text" id="finalPriceText">Estimasi: Rp 0</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="btn btn-success" onclick="resetUpload()">
                            📸 Unggah Sampah Lainnya
                        </button>
                    </div>
                </div>
            </div>`;
    } else {
        content += `
            <div class="rejection-section">
                <h4 style="color: #dc3545; margin-bottom: 15px;">⚠ Sampah Ditolak</h4>
                <p style="color: #6c757d; margin-bottom: 15px;">
                    Tingkat keyakinan terlalu rendah (${(confidence * 100).toFixed(1)}%).<br>
                    Silakan coba gambar lain.
                </p>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="btn" onclick="resetUpload()">
                    📸 Unggah Sampah Lainnya
                </button>
            </div>`;
    }

    content += `</div>`;
    resultDiv.innerHTML = content;
    resultDiv.classList.remove('hidden');

    if (isHighConfidence) {
        const qtyInput = document.getElementById('waste-qty-input');
        const addToCartBtn = document.getElementById('addToCartBtn');
        
        qtyInput.addEventListener('input', () => {
            const qty = parseFloat(qtyInput.value);
            updatePriceEstimate(qty);
            addToCartBtn.disabled = isNaN(qty) || qty <= 0;
        });

        qtyInput.dispatchEvent(new Event('input'));

        addToCartBtn.addEventListener('click', () => {
            const qty = parseFloat(qtyInput.value);
            if (isNaN(qty) || qty <= 0 || qty > 100) {
                showToast('Berat harus lebih dari 0 dan kurang dari 100 kg.', 'error');
                return;
            }
            addToCart(latestPrediction.wasteTypeKey, qty, currentImageURL);
            document.getElementById('inputContainer').style.display = 'none';
            document.getElementById('postAddContainer').classList.add('show');
            
            const estimatedPrice = qty * latestPrediction.price;
            document.getElementById('finalPriceText').textContent = `Estimasi: Rp ${estimatedPrice.toLocaleString('id-ID')}`;
        });
    }
    
    stats.totalAnalysis++;
    if (isHighConfidence) {
        stats.acceptedItems++;
    } else {
        stats.rejectedItems++;
    }
    updateStats();
}

function updatePriceEstimate(qty) {
    const priceText = document.getElementById('priceEstimateText');
    if (isNaN(qty) || qty <= 0) {
        priceText.textContent = 'Estimasi: Rp 0';
        return;
    }
    const estimatedPrice = qty * latestPrediction.price;
    priceText.textContent = `Estimasi: Rp ${estimatedPrice.toLocaleString('id-ID')}`;
}

function addToCart(wasteType, quantity, imageURL) {
    const priceInfo = wastePrice[wasteType];
    const itemPrice = quantity * priceInfo.price;
    
    const itemId = `item-${Date.now()}`;
    if (!cartItems[priceInfo.name]) {
        cartItems[priceInfo.name] = [];
    }
    cartItems[priceInfo.name].push({
        id: itemId,
        quantity: quantity,
        price: itemPrice,
        image: imageURL
    });

    updateCart(cartItems);
    showToast(`Berhasil menambahkan ${quantity.toFixed(2)} kg ${priceInfo.name}.`, 'success');
}

function updateCart(cart) {
    cartItems = cart;
    const cartItemsArray = Object.values(cartItems);
    const totalItemCount = cartItemsArray.reduce((sum, group) => sum + group.length, 0);
    cartCount.textContent = totalItemCount;
    cartCount.style.display = totalItemCount > 0 ? 'block' : 'none';

    let totalPrice = 0;

    cartList.innerHTML = '';
    if (totalItemCount === 0) {
        cartList.innerHTML = `<p id="emptyCartMsg" style="text-align: center; color: #6c757d;">Keranjang masih kosong.</p>`;
    } else {
        for (const wasteClass in cartItems) {
            const items = cartItems[wasteClass];
            if (items.length === 0) continue;
            
            const groupElement = document.createElement('div');
            groupElement.className = 'cart-group';
            
            const groupTotalWeight = items.reduce((sum, item) => sum + item.quantity, 0);
            const groupTotalPrice = items.reduce((sum, item) => sum + item.price, 0);
            totalPrice += groupTotalPrice;
            
            const priceInfo = Object.values(wastePrice).find(info => info.name === wasteClass) || { name: wasteClass, icon: '♻' };

            const groupHeader = document.createElement('div');
            groupHeader.className = 'cart-group-header';
            groupHeader.innerHTML = `
                <span>${priceInfo.icon} ${priceInfo.name}</span>
                <span class="group-total">Total: ${groupTotalWeight.toFixed(2)} kg</span>
            `;
            groupElement.appendChild(groupHeader);
            
            items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <img src="${item.image}" alt="${priceInfo.name}">
                    <div class="cart-item-details">
                        <p style="margin: 0; font-size: 0.9rem;">Berat: ${item.quantity.toFixed(2)} kg</p>
                        <p style="font-weight: bold; color: #28a745; margin: 0;">Harga: Rp ${item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="delete-btn" onclick="removeItem('${wasteClass}', '${item.id}')">✖</button>
                    </div>
                `;
                groupElement.appendChild(itemElement);
            });
            
            cartList.appendChild(groupElement);
        }
    }
    
    cartTotal.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
    checkoutBtn.disabled = totalPrice < checkoutMinPrice;
}

function removeItem(wasteClass, itemId) {
    if (cartItems[wasteClass]) {
        cartItems[wasteClass] = cartItems[wasteClass].filter(item => item.id !== itemId);
        if (cartItems[wasteClass].length === 0) {
            delete cartItems[wasteClass];
        }
    }
    updateCart(cartItems);
    showToast('Item berhasil dihapus.', 'success');
}

async function checkout() {
    toggleButtonLoading(checkoutBtn, true);
    const itemsForHistory = JSON.parse(JSON.stringify(cartItems));

    try {
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        const totalPendapatan = Object.values(cartItems).flat().reduce((sum, item) => sum + item.price, 0);
        const biayaPenjemputan = 15000;
        const pendapatanBersih = totalPendapatan - biayaPenjemputan;
        if (pendapatanBersih < 0) {
            throw new Error("Total pendapatan tidak cukup untuk biaya penjemputan.");
        }

        checkoutResultDiv.innerHTML = `
            <h4 class="font-bold text-lg mb-2">Checkout Berhasil!</h4>
            <div class="text-sm">
                <div class="flex justify-between"><span>Total Pendapatan:</span> <span class="font-semibold">Rp ${totalPendapatan.toLocaleString('id-ID')}</span></div>
                <div class="flex justify-between"><span>Biaya Penjemputan:</span> <span class="font-semibold">- Rp ${biayaPenjemputan.toLocaleString('id-ID')}</span></div>
                <hr class="my-1">
                <div class="flex justify-between font-bold"><span>Anda Menerima:</span> <span>Rp ${pendapatanBersih.toLocaleString('id-ID')}</span></div>
            </div>
        `;
        checkoutResultDiv.classList.remove('hidden');
        
        const newTransaction = {
            id: `txn-${Date.now()}`,
            date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
            items: itemsForHistory,
            totalAmount: pendapatanBersih
        };
        transactionHistory.unshift(newTransaction);
        updateHistoryList();

        stats.totalEarnings += pendapatanBersih;
        updateStats();
        
        cartItems = {};
        updateCart(cartItems);
        showToast(`Checkout Berhasil! Anda menerima Rp ${pendapatanBersih.toLocaleString('id-ID')}`, 'success');
    } catch (error) {
        checkoutResultDiv.innerHTML = `<p class="font-semibold text-red-700">Error: ${error.message}</p>`;
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        toggleButtonLoading(checkoutBtn, false, '✓ Checkout & Minta Jemput');
    }
}

function resetUpload() {
    if (stream) {
        closeCamera();
    }
    
    uploadZone.classList.remove('hidden');
    predictBtn.classList.add('hidden');
    previewSection.style.display = 'none';
    cameraPreviewSection.style.display = 'none';
    resultDiv.classList.add('hidden');
    predictBtn.disabled = true;
    fileInput.value = '';
    latestPrediction = null;
    uploadAgainBtn.classList.add('hidden');
    
    const wasteQtyInput = document.getElementById('waste-qty-input');
    if (wasteQtyInput) {
        wasteQtyInput.value = '';
    }
    
    const postAddContainer = document.getElementById('postAddContainer');
    if (postAddContainer) {
        postAddContainer.classList.remove('show');
    }
    
    const inputContainer = document.getElementById('inputContainer');
    if (inputContainer) {
        inputContainer.style.display = 'flex';
    }
    
    showToast('Silakan unggah gambar sampah baru', 'info');
}

function updateStats() {
    totalAnalysisElement.textContent = stats.totalAnalysis;
    acceptedItemsElement.textContent = stats.acceptedItems;
    rejectedItemsElement.textContent = stats.rejectedItems;
    totalEarningsElement.textContent = `Rp ${stats.totalEarnings.toLocaleString('id-ID')}`;
}

function updateHistoryList() {
    const historyList = document.querySelector('.history-list');
    const header = `<h3 style="margin-bottom: 25px; color: #667eea;">📝 Riwayat Transaksi Terakhir</h3>`;

    if (transactionHistory.length === 0) {
        historyList.innerHTML = header + `<p style="color: #6c757d;">Belum ada riwayat transaksi.</p>`;
        return;
    }

    let historyHTML = '';
    transactionHistory.forEach(tx => {
        const totalItems = Object.values(tx.items).flat().length;
        const itemSummary = Object.keys(tx.items).join(', ');

        historyHTML += `
            <div class="history-item success">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold; font-size: 1.1rem; color: #28a745;">+ Rp ${tx.totalAmount.toLocaleString('id-ID')}</span>
                    <span style="font-size: 0.9rem; color: #6c757d;">${tx.date}</span>
                </div>
                <div>
                    <p style="margin: 0; color: #333;">Penjemputan untuk <strong>${totalItems} item sampah</strong>.</p>
                    <p style="margin: 0; color: #6c757d; font-size: 0.85rem;">Jenis: ${itemSummary}</p>
                </div>
            </div>
        `;
    });

    historyList.innerHTML = header + historyHTML;
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    const toastContent = document.getElementById('toastContent');
    toastContent.innerHTML = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 4000);
}

// Menangani klik di luar sidebar untuk menutupnya
document.addEventListener('click', function (event) {
    const activeSidebar = document.querySelector('.sidebar.active, .cart-sidebar.active');
    
    if (!activeSidebar) {
        return;
    }

    const isBurgerIcon = event.target.closest('#burgerIcon');
    const isCartIcon = event.target.closest('#cartIcon');
    
    if (isBurgerIcon || isCartIcon) {
        return;
    }

    if (!event.target.closest('.sidebar, .cart-sidebar')) {
        activeSidebar.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Landing page akan terlihat pertama kali
    // App container akan muncul setelah login/masuk sebagai tamu
});