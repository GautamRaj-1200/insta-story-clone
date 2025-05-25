document.addEventListener("DOMContentLoaded", () => {
  const storiesContainer = document.querySelector(".stories-container");
  const storyViewer = document.querySelector(".story-viewer");
  const storyImage = document.getElementById("story-image");
  const prevStoryNav = document.querySelector(".story-nav.prev");
  const nextStoryNav = document.querySelector(".story-nav.next");
  const closeButton = document.querySelector(".close-story-viewer");
  const storyProgressContainer = document.querySelector(".story-progress-bar");

  let usersWithStories = [];
  let currentUserIndex = 0;
  let currentStoryItemIndex = 0;
  let storyTimer;
  const STORY_DURATION = 5000; // 5 seconds

  fetch("stories.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      usersWithStories = data.filter(
        (user) => user.storyItems && user.storyItems.length > 0
      );
      renderUserThumbnails();
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
      storiesContainer.innerHTML = "<p>Error loading stories.</p>";
    });

  function renderUserThumbnails() {
    storiesContainer.innerHTML = "";
    usersWithStories.forEach((user, index) => {
      const userItem = document.createElement("div");
      userItem.classList.add("story-item");
      userItem.innerHTML = `
                <img src="${user.userThumbnail}" alt="${user.userName}'s stories">
                <p>${user.userName}</p>
            `;
      userItem.addEventListener("click", () => openStoryForUser(index));
      storiesContainer.appendChild(userItem);
    });
  }

  function createProgressBars(count) {
    storyProgressContainer.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const barSegment = document.createElement("div");
      barSegment.classList.add("story-progress-segment");
      const innerBar = document.createElement("div");
      innerBar.classList.add("story-progress-segment-inner");
      barSegment.appendChild(innerBar);
      storyProgressContainer.appendChild(barSegment);
    }
  }

  function updateProgressBars(activeIndex, progressPercent) {
    const segments = storyProgressContainer.querySelectorAll(
      ".story-progress-segment-inner"
    );
    segments.forEach((segment, index) => {
      if (index < activeIndex) {
        segment.style.width = "100%";
      } else if (index === activeIndex) {
        segment.style.width = `${progressPercent}%`;
      } else {
        segment.style.width = "0%";
      }
    });
  }

  function openStoryForUser(userIndex, storyItemIdx = 0) {
    if (userIndex < 0 || userIndex >= usersWithStories.length) return;

    currentUserIndex = userIndex;
    currentStoryItemIndex = storyItemIdx;

    const user = usersWithStories[currentUserIndex];
    if (!user || !user.storyItems || user.storyItems.length === 0) {
      closeStoryViewer();
      return;
    }
    createProgressBars(user.storyItems.length);
    storyViewer.style.display = "flex";
    loadStoryItem();
  }

  function closeStoryViewer() {
    storyViewer.style.display = "none";
    cancelAnimationFrame(storyTimer);
    storyProgressContainer.innerHTML = "";
  }

  function loadStoryItem() {
    cancelAnimationFrame(storyTimer);
    const user = usersWithStories[currentUserIndex];
    if (
      !user ||
      currentStoryItemIndex < 0 ||
      currentStoryItemIndex >= user.storyItems.length
    ) {
      if (currentUserIndex < usersWithStories.length - 1) {
        openStoryForUser(currentUserIndex + 1);
      } else {
        closeStoryViewer();
      }
      return;
    }

    const storyItem = user.storyItems[currentStoryItemIndex];
    storyImage.src = "";
    storyImage.style.opacity = "0.5";

    const img = new Image();
    img.onload = () => {
      storyImage.src = storyItem.imageUrl;
      storyImage.style.opacity = "1";
      startStoryItemTimer();
    };
    img.onerror = () => {
      console.error("Error loading story image:", storyItem.imageUrl);
      storyImage.alt = "Error loading image";
      storyImage.style.opacity = "1";
      nextStoryItemOrUser();
    };
    img.src = storyItem.imageUrl;
  }

  function nextStoryItemOrUser() {
    const user = usersWithStories[currentUserIndex];
    if (currentStoryItemIndex < user.storyItems.length - 1) {
      currentStoryItemIndex++;
      loadStoryItem();
    } else if (currentUserIndex < usersWithStories.length - 1) {
      openStoryForUser(currentUserIndex + 1);
    } else {
      closeStoryViewer();
    }
  }

  function prevStoryItemOrUser() {
    if (currentStoryItemIndex > 0) {
      currentStoryItemIndex--;
      loadStoryItem();
    } else if (currentUserIndex > 0) {
      const prevUserIndex = currentUserIndex - 1;
      const prevUser = usersWithStories[prevUserIndex];
      openStoryForUser(prevUserIndex, prevUser.storyItems.length - 1);
    }
  }

  function startStoryItemTimer() {
    let startTime = Date.now();
    updateProgressBars(currentStoryItemIndex, 0);

    function animateProgress() {
      const elapsedTime = Date.now() - startTime;
      const progressPercentage = (elapsedTime / STORY_DURATION) * 100;
      updateProgressBars(
        currentStoryItemIndex,
        Math.min(progressPercentage, 100)
      );

      if (elapsedTime < STORY_DURATION) {
        storyTimer = requestAnimationFrame(animateProgress);
      } else {
        nextStoryItemOrUser();
      }
    }
    storyTimer = requestAnimationFrame(animateProgress);
  }

  // Event Listeners
  prevStoryNav.addEventListener("click", (e) => {
    e.stopPropagation();
    prevStoryItemOrUser();
  });

  nextStoryNav.addEventListener("click", (e) => {
    e.stopPropagation();
    nextStoryItemOrUser();
  });

  closeButton.addEventListener("click", closeStoryViewer);

  document.addEventListener("keydown", (e) => {
    if (storyViewer.style.display === "flex") {
      if (e.key === "ArrowLeft") prevStoryItemOrUser();
      if (e.key === "ArrowRight") nextStoryItemOrUser();
      if (e.key === "Escape") closeStoryViewer();
    }
  });
});
