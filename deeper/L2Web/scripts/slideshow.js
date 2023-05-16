const projectContainer = document.querySelector('.project-container');
const projectCards = document.querySelectorAll('.project-card');
const nextButton = document.querySelector('.controls #nextButton');
const prevButton = document.querySelector('.controls #prevButton');

let activeCard = 0;

function setActiveCard(index) {
    projectCards.forEach((card, i) => {
      if (i === index) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
    activeCard = index;
  
    scrollToCard(index); // Add this line to scroll to the newly activated card
  }

function scrollToCard(index) {
    const card = projectCards[index];
    if (card) {
      const cardWidth = card.offsetWidth;
      const scrollLeft = projectContainer.scrollLeft;
      const targetLeft = card.offsetLeft - (projectContainer.offsetWidth - cardWidth) / 2;
  
      projectContainer.scrollTo({
        left: targetLeft + scrollLeft,
        behavior: 'smooth',
      });
    }
}

nextButton.addEventListener('click', () => {
  if (activeCard < projectCards.length - 1) {
    setActiveCard(activeCard + 1);
    scrollToCard(activeCard + 1);
  }
});

prevButton.addEventListener('click', () => {
  if (activeCard > 0) {
    setActiveCard(activeCard - 1);
    scrollToCard(activeCard - 1);
  }
});

projectCards.forEach((card, i) => {
  card.addEventListener('click', () => {
    setActiveCard(i);
    scrollToCard(i);
  });
});

// Set initial active card
setActiveCard(0);
scrollToCard(0);
