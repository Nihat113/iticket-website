"use strict";

(() => {
    const STORAGE_KEY = "iticketBookingCart";
    const STORAGE_PREFIX = `${STORAGE_KEY}:`;
    const STORAGE_VERSION = 1;
    const list = document.getElementById("home-cart-items");
    const count = document.getElementById("home-cart-ticket-count");
    const emptyMessage = document.getElementById("home-cart-empty");
    const totalPrice = document.getElementById("home-cart-total-price");
    const summary = document.getElementById("home-cart-summary");

    if (!list || !count || !emptyMessage || !totalPrice || !summary) return;

    const events = {
        "live-music": { title: "Live Music Night", date: "15 November 2026, 19:00", venue: "Baku Congress Center, Baku" },
        "acoustic-sessions": { title: "Acoustic Sessions", date: "22 November 2026, 20:00", venue: "YARAT Contemporary Art Space, Baku" },
        "electronic-beats": { title: "Electronic Beats", date: "28 November 2026, 21:00", venue: "Sea Breeze Event Hall, Baku" },
        "symphony-evening": { title: "Symphony Evening", date: "5 December 2026, 19:00", venue: "Azerbaijan State Philharmonic, Baku" },
        "jazz-blues": { title: "Jazz & Blues Night", date: "12 December 2026, 20:00", venue: "International Mugham Center, Baku" },
        "rock-arena": { title: "Rock Arena", date: "19 December 2026, 19:30", venue: "Baku Sports Palace, Baku" }
    };

    function readTickets() {
        const tickets = [];
        const seen = new Set();

        try {
            for (let index = 0; index < localStorage.length; index += 1) {
                const key = localStorage.key(index);
                if (key !== STORAGE_KEY && !key?.startsWith(STORAGE_PREFIX)) continue;

                const eventId = key === STORAGE_KEY ? "default" : key.slice(STORAGE_PREFIX.length);
                const event = events[eventId];
                let saved;
                try {
                    saved = JSON.parse(localStorage.getItem(key));
                } catch (error) {
                    continue;
                }
                if (!saved || saved.version !== STORAGE_VERSION || !Array.isArray(saved.tickets)) continue;

                saved.tickets.forEach((ticket) => {
                    if (
                        !ticket ||
                        typeof ticket.seatId !== "string" ||
                        typeof ticket.category !== "string" ||
                        !Number.isFinite(ticket.price) ||
                        !Number.isFinite(ticket.seatNumber) ||
                        typeof ticket.row !== "string"
                    ) return;

                    const uniqueKey = `${eventId}:${ticket.seatId}`;
                    if (seen.has(uniqueKey)) return;
                    seen.add(uniqueKey);
                    tickets.push({
                        ...ticket,
                        eventId,
                        storageKey: key,
                        eventName: event?.title || ticket.eventName || "Selected event",
                        eventDate: event?.date || ticket.eventDate || "Date not available",
                        eventVenue: event?.venue || ticket.eventVenue || "Venue not available"
                    });
                });
            }
        } catch (error) {
            // Storage may be unavailable or contain invalid JSON; show the tickets that could be read.
        }

        return tickets;
    }

    function createTicketItem(ticket) {
        const item = document.createElement("li");
        item.className = "home-cart-item";

        const details = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = ticket.eventName;
        const eventMeta = document.createElement("p");
        eventMeta.className = "home-cart-event-meta";
        eventMeta.textContent = `${ticket.eventDate} · ${ticket.eventVenue}`;
        const seatMeta = document.createElement("p");
        seatMeta.className = "home-cart-seat-meta";
        seatMeta.textContent = `Seat ${ticket.seatNumber} · Row ${ticket.row} · ${ticket.category}`;
        details.append(title, eventMeta, seatMeta);

        const price = document.createElement("strong");
        price.className = "home-cart-price";
        price.textContent = `${ticket.price} AZN`;

        const actions = document.createElement("div");
        actions.className = "home-cart-actions";
        const bookingLink = document.createElement("a");
        bookingLink.href = ticket.eventId === "default"
            ? "booking.html"
            : `booking.html?event=${encodeURIComponent(ticket.eventId)}#cart-title`;
        bookingLink.textContent = "Choose more seats";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "home-cart-remove";
        removeButton.dataset.storageKey = ticket.storageKey;
        removeButton.dataset.seatId = ticket.seatId;
        removeButton.setAttribute("aria-label", `Remove seat ${ticket.seatNumber} for ${ticket.eventName}`);
        removeButton.textContent = "Remove";
        actions.append(bookingLink, removeButton);

        item.append(details, price, actions);
        return item;
    }

    function renderCart() {
        const tickets = readTickets();
        const total = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
        const fragment = document.createDocumentFragment();

        tickets.forEach((ticket) => fragment.append(createTicketItem(ticket)));
        list.replaceChildren(fragment);
        count.textContent = `(${tickets.length})`;
        emptyMessage.hidden = tickets.length > 0;
        totalPrice.textContent = `${total} AZN`;
        summary.textContent = tickets.length
            ? `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"} selected across ${new Set(tickets.map((ticket) => ticket.eventId)).size} event(s).`
            : "Your selected tickets will appear here.";
    }

    list.addEventListener("click", (clickEvent) => {
        const button = clickEvent.target instanceof Element
            ? clickEvent.target.closest("button.home-cart-remove")
            : null;
        if (!button || !list.contains(button)) return;

        try {
            const saved = JSON.parse(localStorage.getItem(button.dataset.storageKey));
            if (saved && saved.version === STORAGE_VERSION && Array.isArray(saved.tickets)) {
                saved.tickets = saved.tickets.filter((ticket) => ticket.seatId !== button.dataset.seatId);
                localStorage.setItem(button.dataset.storageKey, JSON.stringify(saved));
            }
        } catch (error) {
            // Keep the homepage usable if browser storage is unavailable.
        }

        renderCart();
    });

    window.addEventListener("storage", (storageEvent) => {
        if (storageEvent.key === null || storageEvent.key === STORAGE_KEY || storageEvent.key?.startsWith(STORAGE_PREFIX)) {
            renderCart();
        }
    });

    renderCart();
})();
