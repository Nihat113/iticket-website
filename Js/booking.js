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

function initializeVenue() {
    const seatingContainer = document.getElementById("seating-sections");
    if (!seatingContainer) {
        return;
    }

    const venue = createVenueData();
    renderVenue(venue, seatingContainer);

    // Keep the data available for later booking interactions without adding behavior here.
    window.ITicketVenue = venue;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeVenue, { once: true });
} else {
    initializeVenue();
}
