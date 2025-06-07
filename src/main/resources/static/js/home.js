document.addEventListener("DOMContentLoaded", async function () {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    const elements = {
        productList: $(".product-list"),
        searchInput: $("#search-input"),
        sortPrice: $("#sort-price"),
        cartCount: $("#cart-count"),
        prevPage: $("#prev-page"),
        nextPage: $("#next-page"),
        pageInfo: $("#page-info"),
        filterButtons: $$(".filters button"),
        cartBtn: $("#cart-btn"),
        cartPanel: $("#cart-panel"),
        cartPanelItems: $("#cart-panel-items"),
        cartTotal: $("#cart-total"),
        checkoutBtn: $("#checkout-btn"),
        loginBtn: $("#login-btn"),
        registerBtn: $("#register-btn"),
        modals: $$(".modal"),
        closeButtons: $$(".close-modal"),
    };

    const itemsPerPage = 6;
    let currentPage = 1;
    let products = [];
    let cart = [];

    // Gọi API thật
    async function fetchProducts() {
        const res = await fetch("/products");
        const data = await res.json();
        products = data;
        renderProductCards(products);
        applyFilterAndSort("newest");
    }

    // Tạo HTML cho từng sản phẩm
    function renderProductCards(products) {
        elements.productList.innerHTML = "";
        products.forEach(p => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.dataset.category = p.category;
            card.dataset.date = p.date_added;
            card.innerHTML = `
                <img src="${p.image_url}" alt="${p.title}">
                <h3 class="title">${p.title}</h3>
                <p class="price"><span>${p.price}</span> VNĐ</p>
                <p class="origin">Xuất xứ: ${p.origin}</p>
                <p class="rating">⭐ ${p.sold}</p>
                ${p.badge ? `<div class="badge">${p.badge}</div>` : ""}
                <button class="add-to-cart">Thêm vào giỏ</button>
            `;
            elements.productList.appendChild(card);
        });

        // Gán lại sự kiện cho nút giỏ hàng
        addCartEventListeners();
    }

    function addCartEventListeners() {
        $$(".add-to-cart").forEach(btn => {
            btn.onclick = () => {
                const card = btn.closest(".product-card");
                const name = card.querySelector(".title").textContent;
                const price = parseInt(card.querySelector(".price span").textContent);
                const existing = cart.find(item => item.name === name);
                if (!existing) {
                    cart.push({ name, price, quantity: 1 });
                    saveCart();
                    alert("Đã thêm sản phẩm vào giỏ hàng!");
                } else {
                    alert("Sản phẩm đã có trong giỏ hàng!");
                }
            };
        });
    }

    function updateCartUI() {
        elements.cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        const container = elements.cartPanelItems;
        container.innerHTML = cart.length ? "" : '<p style="text-align: center; color: #666;">Giỏ hàng trống</p>';
        cart.forEach((item, i) => {
            const el = document.createElement("div");
            el.className = "cart-item";
            el.innerHTML = `
                <div class="cart-item-info">
                    <div class="name">${item.name}</div>
                    <div class="price">Đơn giá: ${item.price.toLocaleString("vi-VN")} VNĐ</div>
                    <div class="price">Tổng: ${(item.price * item.quantity).toLocaleString("vi-VN")} VNĐ</div>
                    <div class="quantity-control">
                        <button class="decrease" data-i="${i}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="increase" data-i="${i}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-i="${i}">Xóa</button>`;
            container.appendChild(el);
        });

        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        elements.cartTotal.textContent = total.toLocaleString("vi-VN") + " VNĐ";

        container.querySelectorAll(".decrease").forEach(btn => btn.onclick = () => {
            const i = btn.dataset.i;
            if (cart[i].quantity > 1) cart[i].quantity--;
            saveCart();
        });

        container.querySelectorAll(".increase").forEach(btn => btn.onclick = () => {
            cart[btn.dataset.i].quantity++;
            saveCart();
        });

        container.querySelectorAll(".remove-item").forEach(btn => btn.onclick = () => {
            cart.splice(btn.dataset.i, 1);
            saveCart();
        });
    }

    async function saveCart() {
        updateCartUI();
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    async function loadCart() {
        cart = JSON.parse(localStorage.getItem("cart") || "[]");
        updateCartUI();
    }

    function filterProducts(category = "all", query = "") {
        return [...$$(".product-card")].filter(card => {
            const matchCat = category === "all" || card.dataset.category === category;
            const matchQuery = card.querySelector(".title").textContent.toLowerCase().includes(query);
            return matchCat && matchQuery;
        });
    }

    function displayPage(page, cards) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        cards.forEach(c => c.style.display = "none");
        cards.slice(start, end).forEach(c => c.style.display = "block");
        elements.pageInfo.textContent = page;
        elements.prevPage.disabled = page === 1;
        elements.nextPage.disabled = end >= cards.length;
    }

    function applyFilterAndSort(filter = "newest") {
        const category = $("#category-list li.active")?.dataset.category || "all";
        const query = elements.searchInput.value.trim().toLowerCase();
        let cards = filterProducts(category, query);

        if (filter === "newest") {
            cards.sort((a, b) => new Date(b.dataset.date) - new Date(a.dataset.date));
        } else if (filter === "popular" || filter === "bestseller") {
            cards.sort((a, b) => parseInt(b.querySelector(".rating").textContent) - parseInt(a.querySelector(".rating").textContent));
        }

        elements.productList.innerHTML = "";
        cards.forEach(c => elements.productList.appendChild(c));
        displayPage(currentPage, cards);
    }

    // Gán sự kiện tìm kiếm, lọc
    elements.filterButtons.forEach(btn => {
        btn.onclick = () => {
            elements.filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentPage = 1;
            applyFilterAndSort(btn.dataset.filter);
        };
    });

    $$("#category-list li").forEach(item => {
        item.onclick = () => {
            $$("#category-list li").forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            currentPage = 1;
            applyFilterAndSort($(".filters button.active")?.dataset.filter || "newest");
        };
    });

    elements.sortPrice.addEventListener("change", () => {
        const sortVal = elements.sortPrice.value;
        let cards = filterProducts($("#category-list li.active").dataset.category, elements.searchInput.value.trim().toLowerCase());
        cards.sort((a, b) => {
            const priceA = parseFloat(a.querySelector(".price span")?.textContent || 0);
            const priceB = parseFloat(b.querySelector(".price span")?.textContent || 0);
            return sortVal === "asc" ? priceA - priceB : priceB - priceA;
        });
        elements.productList.innerHTML = "";
        cards.forEach(c => elements.productList.appendChild(c));
        displayPage(currentPage, cards);
    });

    elements.prevPage.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            applyFilterAndSort($(".filters button.active")?.dataset.filter || "newest");
        }
    };

    elements.nextPage.onclick = () => {
        currentPage++;
        applyFilterAndSort($(".filters button.active")?.dataset.filter || "newest");
    };

    elements.searchInput.addEventListener("keyup", e => {
        if (e.key === "Enter") {
            currentPage = 1;
            applyFilterAndSort($(".filters button.active")?.dataset.filter || "newest");
        }
    });

    // Init
    await fetchProducts();
    await loadCart();
});
