import React from "react";
import { useNavigate } from "react-router-dom";

const Banner = ({ title, subtitle, image, gradient }) => {
  const navigate = useNavigate();
  return (
    <div className="hero min-h-[420px] rounded-3xl overflow-hidden relative">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover absolute inset-0"
      />
      <div className={`absolute inset-0 ${gradient}`} />
      <div className="hero-content text-center text-neutral-content relative z-10">
        <div className="max-w-md">
          <h1 className="mb-5 text-5xl font-bold text-white drop-shadow-lg">
            {title}
          </h1>
          <p className="mb-5 text-white/90 text-lg">{subtitle}</p>
          <button onClick={() => navigate("/menu")} className="btn btn-primary btn-lg shadow-lg">
            Order Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;
