import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, Upload } from "lucide-react";
import { createFood } from "../../../services/foodService";
import { fetchOwnerCategories } from "../../../services/restaurantService";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  discount: 0,
  stock: "",
  description: "",
  ingredients: "",
  image: "",
  isAvailable: true,
};

const AddFood = ({ base = "/restaurant" } = {}) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchOwnerCategories()
      .then((c) => {
        const names = Array.isArray(c) ? c.map((x) => (typeof x === "string" ? x : x.name)) : [];
        if (active) setCategories(names.length ? names : ["Pizza", "Burger", "Pasta", "Snacks", "Drinks", "Dessert"]);
      })
      .catch(() => {
        if (active) setCategories(["Pizza", "Burger", "Pasta", "Snacks", "Drinks", "Dessert"]);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "isAvailable") {
      setForm((p) => ({ ...p, isAvailable: checked }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) {
      toast.error("Food name, category and price are required.");
      return;
    }
    setSaving(true);
    try {
      await createFood({
        name: form.name,
        category: form.category,
        price: parseFloat(form.price),
        discount: parseFloat(form.discount || 0),
        stock: parseInt(form.stock || 0, 10),
        description: form.description,
        ingredients: form.ingredients,
        image: form.image,
        isAvailable: form.isAvailable,
      });
      toast.success("Food added!");
      navigate(`${base}/foods`);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to add food.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add Food</h1>
        <p className="text-base-content/60 mt-1">
          Add a new item to your restaurant menu. All fields are saved to the database.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-md p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Food Name</span>
            </label>
            <input
              name="name"
              className="input input-bordered"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Chicken Biryani"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Category</span>
            </label>
            <select
              name="category"
              className="select select-bordered"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Price (৳)</span>
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              className="input input-bordered"
              value={form.price}
              onChange={handleChange}
              placeholder="250"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Discount (%)</span>
            </label>
            <input
              name="discount"
              type="number"
              min="0"
              max="100"
              className="input input-bordered"
              value={form.discount}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Quantity / Stock</span>
            </label>
            <input
              name="stock"
              type="number"
              min="0"
              className="input input-bordered"
              value={form.stock}
              onChange={handleChange}
              placeholder="20"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Image URL</span>
            </label>
            <input
              name="image"
              className="input input-bordered"
              value={form.image}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
          <div className="form-control sm:col-span-2">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              name="description"
              className="textarea textarea-bordered"
              rows={2}
              value={form.description}
              onChange={handleChange}
              placeholder="Short description of the dish..."
            />
          </div>
          <div className="form-control sm:col-span-2">
            <label className="label">
              <span className="label-text">Ingredients (comma separated)</span>
            </label>
            <input
              name="ingredients"
              className="input input-bordered"
              value={form.ingredients}
              onChange={handleChange}
              placeholder="rice, chicken, spices, oil"
            />
          </div>
          <div className="form-control sm:col-span-2">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                name="isAvailable"
                type="checkbox"
                className="toggle toggle-primary"
                checked={form.isAvailable}
                onChange={handleChange}
              />
              <span className="label-text">Available for ordering</span>
            </label>
          </div>
        </div>

        {form.image && (
          <div className="mt-4 flex items-center gap-3 text-sm text-base-content/60">
            <Upload className="w-4 h-4" />
            Image preview
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button type="submit" className="btn btn-primary px-10" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Add Food"
            )}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`${base}/foods`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFood;