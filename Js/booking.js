"use strict";

const ticketCategories = {
    vipOrchestra: { name: "VIP Orchestra", price: 120 },
    premiumOrchestra: { name: "Premium Orchestra", price: 85 },
    standardSeating: { name: "Standard Seating", price: 55 },
    balcony: { name: "Balcony", price: 30 }
};

/**
 * Build the venue model with stable IDs so each seat can be found reliably.
 * A few seats are marked unavailable to demonstrate that seat state.
 */
function createVenueData() {
    const sectionDefinitions = [
        { id: "vip-left", name: "VIP Orchestra — Left", categoryKey: "vipOrchestra", rowCount: 2, seatsPerRow: 9 },
        { id: "vip-right", name: "VIP Orchestra — Right", categoryKey: "vipOrchestra", rowCount: 2, seatsPerRow: 9 },
        { id: "premium-center", name: "Premium Orchestra", categoryKey: "premiumOrchestra", rowCount: 3, seatsPerRow: 15 },
        { id: "standard-rear", name: "Standard Seating", categoryKey: "standardSeating", rowCount: 3, seatsPerRow: 22 },
        { id: "balcony", name: "Balcony", categoryKey: "balcony", rowCount: 2, seatsPerRow: 30 }
    ];

    const seats = [];
    const sections = sectionDefinitions.map((definition) => {
        const category = ticketCategories[definition.categoryKey];
        const rows = Array.from({ length: definition.rowCount }, (_, rowIndex) => {
            const row = String(rowIndex + 1);
            const rowSeats = Array.from({ length: definition.seatsPerRow }, (_, seatIndex) => {
                const seatNumber = seatIndex + 1;
                const isUnavailable =
                    (rowIndex === 1 && seatIndex === 2) ||
                    (rowIndex === definition.rowCount - 1 && seatIndex === definition.seatsPerRow - 2);
                const seat = {
                    id: `${definition.id}-row-${row}-seat-${seatNumber}`,
                    sectionId: definition.id,
                    sectionName: definition.name,
                    row,
                    seatNumber,
                    category: category.name,
                    price: category.price,
                    status: isUnavailable ? "unavailable" : "available"
                };
                seats.push(seat);
                return seat;
            });

            return { row, seats: rowSeats };
        });

        return {
            id: definition.id,
            name: definition.name,
            categoryKey: definition.categoryKey,
            category: category.name,
            price: category.price,
            rows
        };
    });

    return { categories: ticketCategories, sections, seats };
}

/** Create one accessible seat button from a seat record. */
function createSeatButton(seat) {
    const button = document.createElement("button");
    const unavailable = seat.status === "unavailable";
    const statusLabel = unavailable ? "unavailable" : "available";

    button.type = "button";
    button.id = seat.id;
    button.className = `venue-seat stadium-seat stadium-seat--${seat.sectionId}${unavailable ? " is-unavailable" : ""}`;
    button.dataset.seatId = seat.id;
    button.dataset.sectionId = seat.sectionId;
    button.dataset.row = seat.row;
    button.dataset.seatNumber = String(seat.seatNumber);
    button.dataset.category = seat.category;
    button.dataset.price = String(seat.price);
    button.dataset.state = seat.status;
    button.textContent = String(seat.seatNumber);
    button.setAttribute("aria-pressed", "false");
    button.setAttribute(
        "aria-label",
        `${seat.category}, row ${seat.row}, seat ${seat.seatNumber}, ${seat.price} AZN, ${statusLabel}`
    );

    if (unavailable) {
        button.disabled = true;
    }

    return button;
}

/** Render all venue sections, rows, and seats into the existing map area. */
function getSeatPosition(section, rowIndex, seatIndex, seatsInRow) {
    const arcs = {
        "vip-left": [145, 215],
        "vip-right": [-35, 35],
        "premium-center": [225, 315],
        "standard-rear": [25, 155],
        balcony: [0, 360]
    };
    const radii = {
        vipOrchestra: [29, 28],
        premiumOrchestra: [31, 29],
        standardSeating: [39, 37],
        balcony: [47, 45]
    };
    const [startAngle, endAngle] = arcs[section.id];
    const [radiusX, radiusY] = radii[section.categoryKey];
    const angleOffset = seatsInRow === 1 ? 0 : (seatIndex / (seatsInRow - 1)) * (endAngle - startAngle);
    const angle = (startAngle + angleOffset + (section.id === "balcony" ? rowIndex * 3.75 : 0)) * (Math.PI / 180);
    const rowRadiusX = radiusX - rowIndex * 3.8;
    const rowRadiusY = radiusY - rowIndex * 3.8;

    return {
        x: 50 + rowRadiusX * Math.cos(angle),
        y: 51 + rowRadiusY * Math.sin(angle)
    };
}

function renderVenue(venue, container) {
    if (!container || !venue || !Array.isArray(venue.sections)) {
        return;
    }

    const fragment = document.createDocumentFragment();

    venue.sections.forEach((section) => {
        const group = document.createElement("section");
        group.className = `stadium-seat-group stadium-seat-group--${section.id}`;
        group.dataset.seatingSection = section.id;

        const heading = document.createElement("h3");
        heading.className = "visually-hidden";
        heading.textContent = `${section.name}, ${section.category}, ${section.price} AZN`;
        group.append(heading);

        section.rows.forEach((rowData, rowIndex) => {
            rowData.seats.forEach((seat, seatIndex) => {
                const button = createSeatButton(seat);
                const position = getSeatPosition(section, rowIndex, seatIndex, rowData.seats.length);
                button.style.setProperty("--seat-x", `${position.x}%`);
                button.style.setProperty("--seat-y", `${position.y}%`);
                button.setAttribute("aria-label", `${seat.category}, row ${seat.row}, seat ${seat.seatNumber}, ${seat.price} AZN, ${seat.status}`);
                group.append(button);
            });
        });

        fragment.append(group);
    });

    container.replaceChildren(fragment);
}

function isEligibleForInspection(seat, button) {
    return Boolean(
        seat &&
        button &&
        !button.disabled &&
        seat.status === "available" &&
        button.dataset.state !== "unavailable" &&
        button.dataset.state !== "in-cart" &&
        !button.classList.contains("is-in-cart")
    );
}

function setSeatLabel(button, seat, stateLabel) {
    button.setAttribute(
        "aria-label",
        `${seat.category}, row ${seat.row}, seat ${seat.seatNumber}, ${seat.price} AZN, ${stateLabel}`
    );
}

function setupShoppingCart(venue, mapContainer) {
    const cartItems = document.getElementById("cart-items");
    const ticketCount = document.getElementById("cart-ticket-count");
    const emptyMessage = document.getElementById("cart-empty-message");
    const totalPrice = document.getElementById("cart-total-price");
    const bookingSummary = document.getElementById("booking-summary");
    const eventTitle = document.querySelector("[data-event-title]");
    const requiredElements = [cartItems, ticketCount, emptyMessage, totalPrice, bookingSummary];

    if (requiredElements.some((element) => !element)) {
        return null;
    }

    const cart = new Map();
    const seatById = new Map(venue.seats.map((seat) => [seat.id, seat]));
    const buttonById = new Map(
        Array.from(mapContainer.querySelectorAll("button[data-seat-id]"), (button) => [button.dataset.seatId, button])
    );

    function getEventName() {
        return eventTitle?.textContent.trim() || "Selected event";
    }

    function createCartEntry(ticket) {
        const item = document.createElement("li");
        item.className = "cart-item";
        item.dataset.seatId = ticket.seatId;

        const event = document.createElement("p");
        event.className = "cart-item-event";
        event.textContent = ticket.eventName;

        const seatDetails = document.createElement("p");
        seatDetails.textContent = `Seat ${ticket.seatNumber} · Row ${ticket.row}`;

        const category = document.createElement("p");
        category.textContent = ticket.category;

        const price = document.createElement("strong");
        price.textContent = `${ticket.price} AZN`;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "cart-remove";
        removeButton.dataset.removeSeatId = ticket.seatId;
        removeButton.setAttribute(
            "aria-label",
            `Remove ${ticket.category}, row ${ticket.row}, seat ${ticket.seatNumber} from cart`
        );
        removeButton.textContent = "Remove";

        item.append(event, seatDetails, category, price, removeButton);
        return item;
    }

    function renderCart() {
        const tickets = Array.from(cart.values());
        const total = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
        const fragment = document.createDocumentFragment();

        tickets.forEach((ticket) => fragment.append(createCartEntry(ticket)));
        cartItems.replaceChildren(fragment);
        ticketCount.textContent = `(${tickets.length})`;
        emptyMessage.hidden = tickets.length > 0;
        totalPrice.textContent = `${total} AZN`;
        bookingSummary.textContent = tickets.length
            ? `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"} selected. Total: ${total} AZN.`
            : "Your booking summary will appear here.";
    }

    function addTicket(seat, button) {
        if (
            !seat ||
            !button ||
            cart.has(seat.id) ||
            seat.status !== "available" ||
            button.dataset.state !== "inspected" ||
            !button.classList.contains("is-inspected")
        ) {
            return false;
        }

        cart.set(seat.id, {
            seatId: seat.id,
            eventName: getEventName(),
            seatNumber: seat.seatNumber,
            row: seat.row,
            category: seat.category,
            price: seat.price
        });

        seat.status = "in-cart";
        button.classList.remove("is-inspected");
        button.classList.add("is-in-cart");
        button.dataset.state = "in-cart";
        button.disabled = true;
        button.setAttribute("aria-pressed", "false");
        setSeatLabel(button, seat, "in cart");
        renderCart();
        return true;
    }

    function removeTicket(seatId) {
        if (!cart.has(seatId)) {
            return;
        }

        cart.delete(seatId);
        const seat = seatById.get(seatId);
        const button = buttonById.get(seatId);
        if (seat && button) {
            seat.status = "available";
            button.classList.remove("is-in-cart", "is-inspected", "is-unavailable");
            button.dataset.state = "available";
            button.disabled = false;
            button.setAttribute("aria-pressed", "false");
            setSeatLabel(button, seat, "available");
        }

        renderCart();
    }

    cartItems.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const removeButton = target?.closest("button[data-remove-seat-id]");
        if (removeButton && cartItems.contains(removeButton)) {
            removeTicket(removeButton.dataset.removeSeatId);
        }
    });

    renderCart();
    return { addTicket, hasTicket: (seatId) => cart.has(seatId) };
}

function setupSeatInspection(venue, container, cart) {
    const seatById = new Map(venue.seats.map((seat) => [seat.id, seat]));
    const selectedSeatNumber = document.getElementById("selected-seat-number");
    const selectedSeatRow = document.getElementById("selected-seat-row");
    const selectedSeatCategory = document.getElementById("selected-seat-category");
    const selectedSeatPrice = document.getElementById("selected-seat-price");
    const addToCartButton = document.getElementById("add-to-cart");
    let inspectedButton = null;

    if (!selectedSeatNumber || !selectedSeatRow || !selectedSeatCategory || !selectedSeatPrice || !addToCartButton || !cart) {
        return;
    }

    function clearInformation() {
        selectedSeatNumber.textContent = "None selected";
        selectedSeatRow.textContent = "—";
        selectedSeatCategory.textContent = "—";
        selectedSeatPrice.textContent = "—";
        addToCartButton.disabled = true;
    }

    container.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const button = target?.closest("button[data-seat-id]");
        if (!button || !container.contains(button)) {
            return;
        }

        const seat = seatById.get(button.dataset.seatId);
        if (cart.hasTicket(seat?.id) || !isEligibleForInspection(seat, button)) {
            return;
        }

        if (inspectedButton && inspectedButton !== button) {
            const previousSeat = seatById.get(inspectedButton.dataset.seatId);
            inspectedButton.classList.remove("is-inspected");
            inspectedButton.dataset.state = previousSeat.status;
            inspectedButton.setAttribute("aria-pressed", "false");
            setSeatLabel(inspectedButton, previousSeat, "available");
        }

        inspectedButton = button;
        button.classList.add("is-inspected");
        button.dataset.state = "inspected";
        button.setAttribute("aria-pressed", "true");
        setSeatLabel(button, seat, "selected for inspection");

        selectedSeatNumber.textContent = String(seat.seatNumber);
        selectedSeatRow.textContent = seat.row;
        selectedSeatCategory.textContent = seat.category;
        selectedSeatPrice.textContent = `${seat.price} AZN`;
        addToCartButton.disabled = false;
    });

    addToCartButton.addEventListener("click", () => {
        if (!inspectedButton) {
            return;
        }

        const seat = seatById.get(inspectedButton.dataset.seatId);
        if (!isEligibleForInspection(seat, inspectedButton) || !cart.addTicket(seat, inspectedButton)) {
            return;
        }

        inspectedButton = null;
        clearInformation();
    });
}

function initializeVenue() {
    const seatingContainer = document.getElementById("seating-sections");
    if (!seatingContainer) {
        return;
    }

    const venue = createVenueData();
    renderVenue(venue, seatingContainer);
    const cart = setupShoppingCart(venue, seatingContainer);
    setupSeatInspection(venue, seatingContainer, cart);

    // Keep the data available for later booking interactions without adding behavior here.
    window.ITicketVenue = venue;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeVenue, { once: true });
} else {
    initializeVenue();
}
