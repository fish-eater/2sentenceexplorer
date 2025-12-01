const CORS_PROXY = "https://corsproxy.io/?url=";
const POST_LIMIT = 600;
let stories = [], index = 0, lastSub = "", lastSort = "";

const shuffle = arr => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

async function getStories(sub, sort) {
  const base = `https://www.reddit.com/r/${sub}/`;
  let url = (sort === "all" || sort === "year")
    ? `${base}top.json?t=${sort}&limit=${POST_LIMIT}`
    : `${base}new.json?limit=${POST_LIMIT}`;
  const resp = await fetch(CORS_PROXY + encodeURIComponent(url));
  if (!resp.ok) throw new Error("Fetch error or CORS fail");
  const data = await resp.json();
  return data.data.children.filter(p =>
    !p.data.stickied && !p.data.over_18 &&
    p.data.selftext && p.data.selftext !== '[removed]' && p.data.selftext !== '[deleted]'
  ).map(p => ({
    title: p.data.title,
    text: p.data.selftext.trim(),
    score: p.data.score
  }));
}

function renderStory(story) {
  const censoredText = story.text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ');
  
  document.getElementById("story").innerHTML =
    `<span class="first-sentence">${story.title}</span>
     <span class="censor-block" id="hiddenSentence" title="reveal">
       <mark class="censor-highlight">${censoredText}</mark>
     </span>
     <span class="upvotes">${story.score.toLocaleString()} upvotes</span>`;
  const el = document.getElementById("hiddenSentence");
  const mark = el.querySelector('.censor-highlight');
  let isRevealed = false;
  
  el.addEventListener('click', function () {
    if (isRevealed) {
      mark.textContent = censoredText;
      mark.style.background = '#101010';
      mark.style.color = '#101010';
      el.setAttribute("title", "reveal");
    } else {
      mark.textContent = story.text;
      mark.style.background = 'transparent';
      mark.style.color = '#181818';
      el.removeAttribute("title");
    }
    isRevealed = !isRevealed;
  });
}



async function loadStoriesAndShow(resetIdx = true) {
  const sub = document.getElementById("subreddit").value;
  const sort = document.getElementById("sort").value;
  document.getElementById("story").innerHTML = '<span class="loading">loading horror...</span>';
  try {
    // fetch if options changed or none loaded yet
    if (sub !== lastSub || sort !== lastSort || !stories.length) {
      stories = shuffle(await getStories(sub, sort));
      lastSub = sub; lastSort = sort;
      if (resetIdx) index = 0;
    }
    if (!stories.length) throw new Error("No stories found.");
    renderStory(stories[index]);
  } catch (e) {
    document.getElementById("story").innerHTML =
      `<span class="loading">failed to load: ${e.message}</span>`;
  }
}

function nextStory() {
  if (!stories.length) { loadStoriesAndShow(); return; }
  index = (index + 1) % stories.length;
  renderStory(stories[index]);
}

document.getElementById("reload").onclick = nextStory;
document.getElementById("subreddit").onchange = () => loadStoriesAndShow();
document.getElementById("sort").onchange = () => loadStoriesAndShow();

window.onload = () => loadStoriesAndShow();
