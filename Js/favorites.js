document.querySelectorAll(".favorite-button").forEach((button) => {
    button.addEventListener("click", () => {
        const isLiked = button.getAttribute("aria-pressed") === "true";
        const nextState = !isLiked;
        const eventName = button.closest(".event-card").querySelector("h3").textContent.trim();

        button.setAttribute("aria-pressed", String(nextState));
        button.setAttribute("aria-label", `${nextState ? "Unlike" : "Like"} ${eventName}`);
        button.classList.toggle("is-liked", nextState);
        button.textContent = nextState ? "♥" : "♡";
    });
});
