// Dynamically load navbar.html into the page
document.addEventListener("DOMContentLoaded", () => {
  fetch("navbar.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("navbar-placeholder").innerHTML = data;
    });
});

document.addEventListener('DOMContentLoaded', function() {
  const services = [
    {
      title: '',
      img: 'about1.jpg',
      desc: `<h3>Committed to Innovation and Excellence</h3>
      <p>We are committed to developing solar energy solutions at Enercore New Energy Private Limited. We offer professional installation and maintenance services for solar panels with an emphasis on quality and innovation. Delivering dependable, effective energy solutions for a greener future is motivated by our dedication to sustainability and excellence.</p>
      <ul style="margin: 12px 0 0 18px; color: #fff;">
        <li>Innovative Solar Solutions.</li>
        <li>Quality Installation & Maintenance.</li>
        <li>Sustainability Commitment.</li>
      </ul>`
    },
    {
      title: '',
      img: 'about2.jpeg',
      desc: `<h3>Why Choose Us!</h3>
      <p>Select us for our unmatched solar energy knowledge and dependability. Our team delivers specialized, effective solutions by fusing state-of-the-art technology with first-rate customer service. We guarantee peak performance and long-term value for your solar investment because we are dedicated to quality and sustainability.</p>
      <ul style="margin: 12px 0 0 18px; color: #fff; columns: 2; column-gap: 30px;">
        <li>Quality Services</li>
        <li>Expert Workers</li>
        <li>Turnkey Solutions</li>
        <li>Customer Support</li>
      </ul>`
    },
    {
      title: 'MATERIAL SPECIFICATIONS',
      img: 'service3.jpg',
      desc: 'We specify the best materials for your project, balancing quality, cost, and sustainability to achieve optimal results.'
    },
    {
      title: 'CUSTOM COMPONENTS',
      img: 'service4.jpg',
      desc: 'We design and fabricate custom components tailored to your unique requirements, ensuring a perfect fit and finish.'
    }
  ];

  let current = 0;

  const sidebarItems = document.querySelectorAll('.service-breakdown-sidebar li');
  const img = document.querySelector('.service-img');
  const contentDiv = document.querySelector('.service-content');
  const leftArrow = document.querySelector('.service-arrow.left');
  const rightArrow = document.querySelector('.service-arrow.right');

  function animateServiceChange(idx, direction = 1) {
    const outClass = 'slide-out';
    const inClass = 'slide-in';
    img.classList.remove(outClass, inClass);
    contentDiv.classList.remove(outClass, inClass);
    img.classList.add(outClass);
    contentDiv.classList.add(outClass);
    setTimeout(() => {
      img.src = services[idx].img;
      img.alt = services[idx].title;
      contentDiv.innerHTML = services[idx].desc;
      current = idx;
      img.classList.remove(outClass);
      contentDiv.classList.remove(outClass);
      img.classList.add(inClass);
      contentDiv.classList.add(inClass);
      setTimeout(() => {
        img.classList.remove(inClass);
        contentDiv.classList.remove(inClass);
      }, 400);
    }, 400);
  }

  leftArrow.addEventListener('click', () => {
    let idx = (current - 1 + services.length) % services.length;
    animateServiceChange(idx, -1);
  });

  rightArrow.addEventListener('click', () => {
    let idx = (current + 1) % services.length;
    animateServiceChange(idx, 1);
  });

  // Initial state
  img.classList.remove('slide-in', 'slide-out');
  contentDiv.classList.remove('slide-in', 'slide-out');
  contentDiv.innerHTML = services[0].desc;
});
