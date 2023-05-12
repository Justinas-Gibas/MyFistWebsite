document.addEventListener('DOMContentLoaded', function() {
  // Select all links with the .nav-link class
  const navLinks = document.querySelectorAll('.nav-link');

  // Add a click event listener to each link
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Prevent the default link behavior
      e.preventDefault();

      // Get the target section from the link href attribute
      const targetSection = document.querySelector(link.getAttribute('href'));

      // Scroll smoothly to the target section
      targetSection.scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  const wrapper = document.querySelector('.wrapper');
  let scrollPosition;

  window.addEventListener('scroll', () => {
    scrollPosition = window.pageYOffset;
    wrapper.style.transform = `translateY(${scrollPosition * 0.5}px)`;
  });
});