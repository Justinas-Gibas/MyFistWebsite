const projectContainer = document.querySelector('.project-container');
const projectCards = document.querySelectorAll('.project-card');
const nextButton = document.querySelector('.controls #nextButton');
const prevButton = document.querySelector('.controls #prevButton');

let activeCard = 0;
let touchStartX = 0;
let touchEndX = 0;

function setActiveCard(index) {
    projectCards.forEach((card, i) => {
      if (i === index) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
    activeCard = index;
  
    /*scrollToCard(index);*/ // Add this line to scroll to the newly activated card
  }

function scrollToCard(index) {
  const card = projectCards[index];
  if (card) {
    const containerWidth = projectContainer.offsetWidth;
    const containerScrollLeft = projectContainer.scrollLeft;
    const cardOffsetLeft = card.offsetLeft;
    const cardWidth = projectCards[index].offsetWidth;
    const targetLeft = projectCards[index].offsetLeft - (containerWidth - cardWidth) / 2;
    const maxScrollLeft = projectContainer.scrollWidth - containerWidth;
    const scrollLeft = projectContainer.scrollLeft;

    if (targetLeft < containerScrollLeft || targetLeft + containerWidth > containerScrollLeft + containerWidth) {
      projectContainer.scrollTo({
        left: Math.min(maxScrollLeft, Math.max(0, targetLeft)),
        behavior: 'smooth',
    });
    }
  }
}

nextButton.addEventListener('click', () => {
  if (activeCard < projectCards.length - 1) {
    setActiveCard(activeCard + 1);
    scrollToCard(activeCard);
  }
});

prevButton.addEventListener('click', () => {
  if (activeCard > 0) {
    setActiveCard(activeCard - 1);
    scrollToCard(activeCard);
  }
});

projectCards.forEach((card, i) => {
  card.addEventListener('click', () => {
    setActiveCard(i);
    scrollToCard(i);
  });
});

projectContainer.addEventListener('wheel', (event) => {
    event.preventDefault();
    const delta = Math.sign(event.deltaY);
    if (delta > 0) {
      if (activeCard < projectCards.length - 1) {
        setActiveCard(activeCard + 1);
        scrollToCard(activeCard);
      }
    } else if (delta < 0) {
      if (activeCard > 0) {
        setActiveCard(activeCard - 1);
        scrollToCard(activeCard);
      }
    }
  });

projectContainer.addEventListener('touchstart', (event) => {
  touchStartX = event.touches[0].clientX;
});

projectContainer.addEventListener('touchend', (event) => {
  touchEndX = event.changedTouches[0].clientX;
  handleSwipeGesture();
});

function handleSwipeGesture() {
  const swipeThreshold = 10; // Adjust this value to control swipe sensitivity

  if (touchEndX < touchStartX - swipeThreshold) {
    // Swiped left
    if (activeCard < projectCards.length - 1) {
      setActiveCard(activeCard + 1);
      scrollToCard(activeCard);
    }
  } else if (touchEndX > touchStartX + swipeThreshold) {
    // Swiped right
    if (activeCard > 0) {
      setActiveCard(activeCard - 1);
      scrollToCard(activeCard);
    }
  }
}

// Set initial active card
setActiveCard(0);
scrollToCard(0);
