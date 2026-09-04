// Simulation of "add to cart, then refresh" using the REAL cartStore.
// localStorage mock + module cache-busting to emulate a full page reload.
const backing = {};
globalThis.localStorage = {
  getItem: (k) => (k in backing ? backing[k] : null),
  setItem: (k, v) => { backing[k] = String(v); },
  removeItem: (k) => { delete backing[k]; },
};

// First "page load": customer A logged in adds an item.
backing["mamun_auth_user"] = JSON.stringify({ id: "USER_A", role: "customer" });

const { useCartStore } = await import("./src/store/cartStore.js?load=1");
useCartStore.getState().addItem({
  id: "f1", name: "Chicken Sandwich", price: 120, discount: 10, image: "x.png",
});
const savedKeys = Object.keys(backing);
console.log("after add -> items:", JSON.stringify(useCartStore.getState().items));
console.log("localStorage keys:", savedKeys);
console.log("cart value:", backing[savedKeys.find((k) => k.startsWith("food-cart"))]);

// Simulate REFRESH: wipe module cache, create a brand-new store, keep localStorage.
for (const key of Object.keys(globalThis.require?.cache || {})) delete globalThis.require.cache[key];
const { useCartStore: freshStore } = await import(`./src/store/cartStore.js?refresh=${Date.now()}`);

console.log("AFTER REFRESH -> items:", JSON.stringify(freshStore.getState().items));
console.log("cart restored on refresh:", freshStore.getState().items.length > 0);

// Customer B scenario: switch user in localStorage, new reload should see B's own (empty) cart.
backing["mamun_auth_user"] = JSON.stringify({ id: "USER_B", role: "customer" });
const { useCartStore: userB } = await import(`./src/store/cartStore.js?loadB=${Date.now()}`);
console.log("User B sees items:", JSON.stringify(userB.getState().items), "(isolated from A:", userB.getState().items.length === 0, ")");