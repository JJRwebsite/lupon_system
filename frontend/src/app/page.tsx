"use client";
import { useState, useEffect } from "react";
import { HomeIcon, DocumentTextIcon, UserGroupIcon, InformationCircleIcon, PhoneIcon, MapPinIcon, Bars3Icon, XMarkIcon, UserIcon, UsersIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

const navLinks = [
  { label: "Home", icon: HomeIcon, href: "#home" },
  { label: "About", icon: InformationCircleIcon, href: "#about" },
  { label: "Services", icon: DocumentTextIcon, href: "#services" },
  { label: "Officials", icon: UserGroupIcon, href: "#officials" },
  { label: "Location", icon: MapPinIcon, href: "#location" },
];

interface LuponMember {
  id: number;
  name: string;
  date_added: string;
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [luponData, setLuponData] = useState<{
    chairperson: LuponMember[];
    members: LuponMember[];
    secretary: LuponMember[];
  }>({ chairperson: [], members: [], secretary: [] });

  // Fetch Lupon data
  const fetchLuponData = async () => {
    try {
      const [membersRes, chairRes, secRes] = await Promise.all([
        fetch('http://localhost:5000/api/lupon-members'),
        fetch('http://localhost:5000/api/lupon-chairperson'),
        fetch('http://localhost:5000/api/lupon-secretary'),
      ]);
      const [members, chairperson, secretary] = await Promise.all([
        membersRes.json(),
        chairRes.json(),
        secRes.json(),
      ]);
      setLuponData({ members, chairperson, secretary });
    } catch (error) {
      console.error('Error fetching Lupon data:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    fetchLuponData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-lg' : 'bg-white/90 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Empty space for logo removal */}
            <div></div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <link.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{link.label}</span>
                </button>
              ))}
              <a
                href="/login"
                className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
              >
                Login
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-3 space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 text-left"
                >
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{link.label}</span>
                </button>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <a
                  href="/login"
                  className="flex items-center gap-3 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  <UserIcon className="h-5 w-5 flex-shrink-0" />
                  <span>Login</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800">
          <div className="absolute inset-0 bg-black/30"></div>
          {/* Decorative elements - responsive */}
          <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-24 sm:w-40 h-24 sm:h-40 bg-blue-300/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-12">
          {/* Logo above title */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 relative">
              <Image
                src="/barangay-logo.png.jpg"
                alt="Barangay Ibabao Logo"
                width={160}
                height={160}
                className="rounded-full object-cover border-4 border-white/20 shadow-2xl"
              />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight">
            LUPON TAGAPAMAYAPA
          </h1>
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light mb-6 sm:mb-8 text-white/90">
            Barangay Ibabao, Cordova
          </h2>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-white/20">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 leading-relaxed">
              Committed to peaceful resolution of disputes and fostering harmony within our community through mediation, conciliation, and arbitration services.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">About Barangay Ibabao</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the rich history and vibrant community of Barangay Ibabao, Cordova
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">History</h3>
                <p className="text-gray-700 mb-4">
                  Cordova, including Barangay Ibabao, was originally part of Opon (now Lapu-Lapu City) before becoming an independent municipality in 1992.
                </p>
                <p className="text-gray-700 mb-4">
                  The name "Ibabao" comes from the Cebuano word meaning "upper ground" or "elevated," which reflects the geographic position of our barangay.
                </p>
                <p className="text-gray-700">
                  Over the years, Barangay Ibabao has grown into a thriving community with a mix of residential, commercial, and recreational areas.
                </p>
              </div>
            </div>
            
            <div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Today</h3>
                <p className="text-gray-700 mb-4">
                  Ibabao is a thriving community with a mix of residential, commercial, and recreational areas. It continues to play a vital role in the economic and cultural life of Cordova.
                </p>
                <p className="text-gray-700">
                  Our Lupon Tagapamayapa serves as the cornerstone of peaceful dispute resolution, ensuring harmony and justice within our community through proper mediation and arbitration services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The Lupon Tagapamayapa provides comprehensive dispute resolution services to our community
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Mediation</h3>
              <p className="text-gray-600">
                Facilitated dialogue between parties to reach mutually acceptable solutions with the help of neutral mediators.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <DocumentTextIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Conciliation</h3>
              <p className="text-gray-600">
                Structured process where a conciliator assists parties in identifying issues and developing options for resolution.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <InformationCircleIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Arbitration</h3>
              <p className="text-gray-600">
                Formal process where an arbitrator makes binding decisions to resolve disputes when other methods are unsuccessful.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Officials Section - Organizational Structure */}
      <section id="officials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold text-blue-900 mb-8">LUPON TAGAPAMAYAPA ORGANIZATIONAL STRUCTURE</h1>
          </div>

          {/* Organizational Chart */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 shadow-lg">
            {/* Top Level - Chairperson */}
            <div className="flex justify-center mb-12">
              <div className="text-center">
                {luponData.chairperson.length > 0 ? (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <UserIcon className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{luponData.chairperson[0].name}</h3>
                    <p className="text-sm text-blue-600 font-semibold">PUNONG BARANGAY/LUPON CHAIRPERSON</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
                    <div className="w-24 h-24 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserIcon className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">No Chairperson</h3>
                    <p className="text-sm text-gray-600">PUNONG BARANGAY/LUPON CHAIRPERSON</p>
                  </div>
                )}
              </div>
            </div>

            {/* Connection Line */}
            <div className="flex justify-center mb-8">
              <div className="w-px h-12 bg-blue-300"></div>
            </div>

            {/* Second Level - Secretary */}
            <div className="flex justify-center mb-12">
              <div className="text-center">
                {luponData.secretary.length > 0 ? (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <UserIcon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-1">{luponData.secretary[0].name}</h3>
                    <p className="text-xs text-purple-600 font-semibold">COMMITTEE CHAIR ON KATARUNGANG PAMBARANGAY</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
                    <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserIcon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-1">No Secretary</h3>
                    <p className="text-xs text-gray-600">COMMITTEE CHAIR ON KATARUNGANG PAMBARANGAY</p>
                  </div>
                )}
              </div>
            </div>

            {/* Connection Line */}
            <div className="flex justify-center mb-8">
              <div className="w-px h-12 bg-blue-300"></div>
            </div>

            {/* Bottom Level - Lupon Members */}
            <div className="">
              <h4 className="text-center text-xl font-bold text-gray-900 mb-8">LUPON TAGAPAMAYAPA</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {luponData.members.length > 0 ? (
                  luponData.members.map((member, index) => (
                    <div key={member.id} className="text-center">
                      <div className="bg-white rounded-xl p-4 shadow-md border border-green-200 hover:shadow-lg transition-shadow duration-300">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                          <UserIcon className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="font-semibold text-sm text-gray-900 mb-1">{member.name}</h4>
                        <p className="text-xs text-green-600 font-medium">LUPON TAGAPAMAYAPA</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UsersIcon className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-600">No Lupon members configured</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <div className="bg-blue-50 rounded-2xl p-6 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-blue-900 mb-4">About the Lupon Tagapamayapa</h3>
              <p className="text-gray-700 leading-relaxed">
                The Lupon Tagapamayapa is composed of the Punong Barangay as chairperson and 10 to 20 members appointed by the Punong Barangay. 
                They are responsible for mediating and settling disputes at the barangay level, promoting peace and harmony within the community 
                through the Katarungang Pambarangay system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section with Map */}
      <section id="location" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Find Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Located in the heart of Barangay Ibabao, Cordova, Cebu
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPinIcon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Address</h4>
                      <p className="text-gray-600">Barangay Ibabao, Cordova, Cebu, Philippines</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <PhoneIcon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Phone</h4>
                      <p className="text-gray-600">(032) XXX-XXXX</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Office Hours</h4>
                      <p className="text-gray-600">Monday - Friday: 8:00 AM - 5:00 PM</p>
                      <p className="text-gray-600">Saturday: 8:00 AM - 12:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              {/* Map Container */}
              <div className="bg-gray-200 rounded-2xl overflow-hidden shadow-lg" style={{ height: '400px' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d245.36794524136744!2d123.94722776591325!3d10.27067792213064!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a99a40cb6f07c1%3A0xcf2ff8c71c4fd116!2sIbabao%20Barangay%20Hall!5e0!3m2!1sen!2sph!4v1757399386283!5m2!1sen!2sph"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ibabao Barangay Hall Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Lupon Tagapamayapa</h3>
                  <p className="text-sm text-gray-400">Barangay Ibabao, Cordova</p>
                </div>
              </div>
              <p className="text-gray-400">
                Promoting peace and harmony through effective dispute resolution in our community.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('#home')} className="text-gray-400 hover:text-white transition-colors">Home</button></li>
                <li><button onClick={() => scrollToSection('#about')} className="text-gray-400 hover:text-white transition-colors">About</button></li>
                <li><button onClick={() => scrollToSection('#services')} className="text-gray-400 hover:text-white transition-colors">Services</button></li>
                <li><a href="/login" className="text-gray-400 hover:text-white transition-colors">Login</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <p>Barangay Ibabao, Cordova, Cebu</p>
                <p>(032) XXX-XXXX</p>
                <p>Mon-Fri: 8:00 AM - 5:00 PM</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Lupon Tagapamayapa - Barangay Ibabao, Cordova. All rights reserved.</p>
            <p>&copy; Capstone project of Cordova Public College</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
