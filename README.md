# Interactive Portfolio - Naveen Busiraju

A modern, interactive portfolio website featuring Three.js 3D animations, smooth scrolling, and professional UX enhancements.

## Features

### 🎨 Visual Effects
- **3D Particle Network Background**: Dynamic particle system with interactive connections in the hero section
- **Floating Geometric Shapes**: Animated 3D wireframe objects (icosahedron, octahedron, torus)
- **Loading Screen**: Custom Three.js loading animation
- **Smooth Scrolling**: Implemented with Lenis for buttery-smooth page navigation
- **Custom Cursor**: Magnetic cursor that responds to interactive elements

### ✨ Animations
- **GSAP Animations**: Professional scroll-triggered animations throughout
- **Parallax Effects**: Mouse-following camera movements and card parallax
- **Magnetic Buttons**: Buttons that respond to mouse proximity
- **Card Hover Effects**: 3D transform effects on skill cards
- **Scroll Progress Bar**: Visual indicator of page scroll progress

### 🎯 UX Enhancements
- **Dark/Light Theme Toggle**: Switch between themes with system preference detection
- **Smooth Page Transitions**: Fade-in animations for all sections
- **Active Navigation**: Auto-highlighting navigation based on scroll position
- **Scroll to Top Button**: Convenient quick navigation to top
- **Glassmorphism Design**: Modern glass-effect cards
- **Subtle Card Parallax**: Gentle 3D tilt effect on hover (optimized for readability)
- **Responsive Design**: Works seamlessly across all devices
- **Accessibility**: Reduced motion support for users who prefer it

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js
- **Animations**: GSAP (GreenSock Animation Platform)
- **Smooth Scroll**: Lenis
- **UI Framework**: Bootstrap 5
- **Backend**: Node.js + Express
- **Database**: MongoDB (for future contact form storage)

## Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd Portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
Portfolio/
├── public/
│   ├── css/
│   │   └── style.css          # Custom styles, themes and animations
│   ├── js/
│   │   ├── three-background.js # Three.js particle system
│   │   ├── animations.js       # GSAP scroll animations
│   │   ├── interactions.js     # User interactions & cursor
│   │   └── theme-toggle.js     # Dark/light theme switcher
│   └── index.html              # Main HTML file
├── node_modules/               # Dependencies
├── index.js                    # Express server
├── package.json                # Project configuration
└── README.md                   # Documentation
```

## Customization

### Changing Colors
Edit the CSS variables in `public/css/style.css`:
```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --dark-bg: #0a0e27;
}
```

### Adjusting Particle Count
In `public/js/three-background.js`, modify the `particleCount` variable:
```javascript
const particleCount = 100; // Increase for more particles (impacts performance)
```

### Animation Speed
In `public/js/animations.js`, adjust GSAP duration values:
```javascript
duration: 1, // Increase for slower animations
```

## Performance Optimization

- Particle connections update selectively (95% frame skip) for better performance
- Pixel ratio capped at 2 for high-DPI displays
- Three.js fog for depth without extra rendering cost
- Lazy loading for scroll-triggered animations
- Reduced motion support for accessibility

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## Future Enhancements

- [ ] Add project showcase section with 3D project cards
- [ ] Integrate contact form with MongoDB
- [ ] Add dark/light theme toggle
- [ ] Implement blog section
- [ ] Add downloadable resume with animation
- [ ] Create admin panel for content management

## Credits

**Developer**: Venkata Naveen Busiraju
**Email**: naveenbusiraju@gmail.com
**LinkedIn**: [linkedin.com/in/naveenbusiraju](https://www.linkedin.com/in/naveenbusiraju/)

## License

ISC License - Feel free to use this portfolio as inspiration for your own!

---

Made with ❤️ using Three.js, GSAP, and modern web technologies
