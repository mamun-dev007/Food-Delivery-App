import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import logo from "../../assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-neutral text-neutral-content mt-16">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo + About */}
          <div>
            <a href="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Foodie" className="h-10 w-auto object-contain bg-white rounded-lg p-1" />
              <span className="text-2xl font-extrabold">
                <span className="text-primary">Foo</span>
                <span className="text-secondary">die</span>
              </span>
            </a>
            <p className="text-sm text-neutral-content/70 leading-relaxed">
              Foodie brings delicious food from your favorite restaurants
              straight to your door. Fast delivery, fresh quality, and live
              tracking you can trust.
            </p>
            <div className="flex gap-3 mt-5">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Instagram, label: "Instagram" },
                { icon: Twitter, label: "Twitter" },
                { icon: Youtube, label: "YouTube" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-neutral-content/10 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h6 className="footer-title">Quick Links</h6>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/menu" className="link link-hover">Menu</Link></li>
              <li><Link to="/restaurants" className="link link-hover">Restaurants</Link></li>
              <li><Link to="/categories" className="link link-hover">Categories</Link></li>
              <li><Link to="/offers" className="link link-hover">Offers</Link></li>
              <li><Link to="/track-order" className="link link-hover">Track Order</Link></li>
              <li><Link to="/cart" className="link link-hover">Cart</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h6 className="footer-title">Contact</h6>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>123 Food Street, Gulshan, Dhaka 1212, Bangladesh</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 shrink-0" />
                <a href="tel:+8801712345678" className="link link-hover">+880 1712 345 678</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:support@foodie.com" className="link link-hover">support@foodie.com</a>
              </li>
            </ul>
            <div className="mt-6">
              <h6 className="footer-title">For Business</h6>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/dashboard" className="link link-hover">Restaurant Panel</Link></li>
                <li><Link to="/rider" className="link link-hover">Rider Panel</Link></li>
                <li><Link to="/admin" className="link link-hover">Admin Panel</Link></li>
              </ul>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h6 className="footer-title">Legal</h6>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="link link-hover">Privacy Policy</a></li>
              <li><a href="#" className="link link-hover">Terms & Conditions</a></li>
              <li><a href="#" className="link link-hover">Cookie Policy</a></li>
              <li><a href="#" className="link link-hover">Refund Policy</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-content/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-content/60">
          <p>© {new Date().getFullYear()} Foodie. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="link link-hover">Privacy Policy</a>
            <a href="#" className="link link-hover">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
