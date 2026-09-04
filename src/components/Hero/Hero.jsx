import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css/pagination";
import Banner from "./Banner";

const slides = [
  {
    title: "Delicious Food, Delivered Fast",
    subtitle: "Fresh, hot meals from the best local restaurants straight to your door.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80",
    gradient: "bg-gradient-to-b from-black/40 via-black/40 to-black/60",
  },
  {
    title: "Craving Something Sweet?",
    subtitle: "Desserts and drinks that hit every craving. Order in minutes.",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=80",
    gradient: "bg-gradient-to-b from-black/30 via-black/40 to-black/60",
  },
  {
    title: "Healthy & Fresh Choices",
    subtitle: "Nutritious bowls, salads and smoothies made with the finest ingredients.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80",
    gradient: "bg-gradient-to-b from-black/30 via-black/40 to-black/60",
  },
];

const Hero = () => {
  return (
    <div className="my-8">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        loop
        pagination={{ clickable: true }}
        spaceBetween={20}
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={idx}>
            <Banner {...slide} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Hero;
