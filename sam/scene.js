import { copy } from './approved.js';

const fleetBase = 'https://melissa-frontend-holieninnovation.github.io/senditgo-carrier-demo/';
const cast = [
  {
    id: 'mate', name: 'The Run Mate',
    film: 'run-mate-film.mp4?v=becca51740c6', posterVersion: '7330d893be6e',
    route: 'run-management/order-management/',
    bio: 'Inspired by Samwise Gamgee, the mate who stays when the job gets hard. At the depot laptop, he helps the dispatcher fit a late drop into the run. She makes the final call.',
    product: 'A dispatcher reassigns one order in this recorded Fleet Web example.',
    chapters: [
      { shot: 'SAM types the order number into Fleet Web at the depot computer.', screen: 'SAM searches for order S0170025 on Sophie Taylor’s run.', focus: [.5, 0] },
      { shot: 'He finds a gap on Olivia Parker’s run and checks the impact on the map.', screen: 'Fleet Web previews the insertion on Olivia Parker’s run before the change is applied.', focus: [.57, .9] },
      { shot: 'The dispatcher reviews the reassignment in Fleet Web.', screen: 'Fleet Web displays “Run Sheets updated” after the reassignment.', focus: [.85, .17] }
    ]
  },
  {
    id: 'loader', name: 'The Load Planner',
    film: 'load-planner-film.mp4?v=0294ca390007', posterVersion: '51f71da8cb77',
    route: 'fleets/nsw-metro/drivers/',
    bio: 'Before the cartons leave the depot, he checks the vehicle’s load rating and dimensions.',
    product: 'SAM looks up a van in Drivers and Vehicles.',
    chapters: [
      { shot: 'At the depot computer, SAM types the van’s registration into Fleet Web.', screen: 'The search for WV-005 brings up its vehicle record.', focus: [.27, .24] },
      { shot: 'He opens the record to check the van’s make and model.', screen: 'Registration WV-005 belongs to a white Mercedes Sprinter.', focus: [.85, .5] },
      { shot: 'He brings up the load rating and dimensions for the depot team.', screen: 'More vehicle details shows a load rating of 1,600 kg and a width of 1,990 mm.', focus: [.85, .57] }
    ]
  },
  {
    id: 'relay', name: 'The Relay Driver',
    film: 'relay-driver-film.mp4?v=68706a7a90bd', posterVersion: 'b093740d6517',
    route: 'run-management/run-sheets/',
    bio: 'He handles the late shift on a regional run. At changeover, he makes sure the incoming driver has the latest plan.',
    product: 'SAM opens the afternoon run sheet for the driver handover.',
    chapters: [
      { shot: 'At the depot laptop, SAM types Sophie Taylor’s name into Run Sheets.', screen: 'The search brings up Sophie Taylor’s run sheets.', focus: [.53, .16] },
      { shot: 'He opens the afternoon run sheet to check its departure and stops.', screen: 'Run sheet 48214 lists six stops and a 13:00 depot departure.', focus: [.80, .37] },
      { shot: 'He shows the incoming driver the first stop and its planned arrival.', screen: 'The first stop is for Yara Haddad in Parramatta, with arrival planned for 13:27.', focus: [.82, .35] }
    ]
  }
];
const $ = id => document.getElementById(id);
const choices = Array.from(document.querySelectorAll('#choices button'));
const beats = Array.from(document.querySelectorAll('#beats button'));
const modal = document.querySelector('dialog');
const zoom = document.querySelector('#zoom');
const screen = document.querySelector('#screen');
const fallback = document.querySelector('#fallback');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const film = document.querySelector('video');
let actor = cast[0], step = 0;
let playbackRequest = 0;
let startAt = 0;
let playing = false;
function stop() {
  playbackRequest++;
  playing = false;
  film.pause();
  $('control').textContent = film.ended ? 'Replay scene' : 'Play scene';
}
function paint() {
  const chapter = actor.chapters[step];
  $('name').textContent = actor.name;
  $('bio').textContent = actor.bio;
  $('caption').textContent = chapter.shot;
  $('frame').style.backgroundImage = 'url(./sam/' + actor.id + '.webp?v=' + actor.posterVersion + ')';
  $('frame').style.backgroundPositionX = (step * 50) + '%';
  $('frame').setAttribute('aria-label', chapter.shot);
  $('fleet-demo').href = fleetBase + actor.route;
  $('product-context').textContent = actor.product;
  $('product-caption').textContent = chapter.screen;
  if (screen instanceof HTMLImageElement) {
    const src = './sam/' + actor.id + '-screen-' + (step + 1) + '.webp';
    if (screen.getAttribute('src') !== src) screen.src = src;
    screen.alt = chapter.screen;
  }
  choices.forEach((button,i)=>button.setAttribute('aria-pressed',String(cast[i] === actor)));
  beats.forEach((button,i)=>button.setAttribute('aria-pressed',String(step === i)));
}
function playScene() {
  const request = ++playbackRequest;
  const source = './sam/' + actor.film;
  playing = true;
  $('status').textContent = '';
  $('control').textContent = 'Pause scene';
  if (film.getAttribute('src') !== source || film.error) film.src = source;
  if (startAt !== null) {
    film.currentTime = startAt;
    startAt = null;
  } else if (film.ended) {
    film.currentTime = 0;
  }
  film.play().then(() => {
    if (request === playbackRequest) film.hidden = false;
  }).catch(error => {
    if (request !== playbackRequest) return;
    stop();
    film.hidden = true;
    startAt = step * 3;
    if (error.name !== 'NotAllowedError') $('status').textContent = 'The film could not load. You can still step through the scene.';
  });
}
film.addEventListener('timeupdate', () => {
  if (film.hidden || !playing || film.seeking) return;
  const index = Math.min(2, Math.floor(film.currentTime / 3));
  if (index !== step) { step = index; paint(); }
});
film.addEventListener('ended', () => {
  if (!playing) return;
  step = 2;
  paint();
  stop();
});
film.addEventListener('error', () => {
  if (!playing) return;
  stop();
  film.hidden = true;
  startAt = step * 3;
  $('status').textContent = 'The film could not load. You can still step through the scene.';
});
function select(member, index, autoplay) {
  stop();
  film.hidden = true;
  $('control').textContent = 'Play scene';
  actor = member;
  step = index;
  startAt = index * 3;
  $('status').textContent = '';
  if (fallback instanceof HTMLInputElement) fallback.hidden = true;
  paint();
  if (autoplay && !reduced.matches && !document.hidden) playScene();
}
function readLink() {
  const [id,raw] = location.hash.slice(1).split('/');
  const member = cast.find(item=>item.id === id);
  const explicit = Boolean(member || id === 'sam') && ['1','2','3'].includes(raw);
  if (!member && id) history.replaceState(null,'','#mate' + (explicit ? '/' + raw : ''));
  select(member || cast[0], explicit ? Number(raw)-1 : 0, !explicit || raw === '1');
}
choices.forEach((button,i)=>button.addEventListener('click',()=>{
  history.replaceState(null,'','#' + cast[i].id);
  select(cast[i],0,true);
}));
beats.forEach((button,i)=>button.addEventListener('click',()=>{
  history.replaceState(null,'','#' + actor.id + '/' + (i+1));
  select(actor,i,false);
}));
$('control').addEventListener('click', () => {
  if (playing) stop();
  else playScene();
});
$('share').addEventListener('click', async()=>{
  stop();
  const link = new URL(location.href);
  link.hash = actor.id + '/' + (step+1);
  try { await navigator.clipboard.writeText(link.href); $('status').textContent = 'Link copied for ' + actor.name + '.'; }
  catch { if (fallback instanceof HTMLInputElement) { fallback.hidden = false; fallback.value = link.href; fallback.select(); $('status').textContent = 'Copy the selected link.'; } }
});
function enlarge() {
  stop();
  if (zoom instanceof HTMLImageElement && screen instanceof HTMLImageElement) { zoom.src = screen.src; zoom.alt = screen.alt; }
  modal.showModal();
  const panel = document.querySelector('.zoom-pan');
  const [x,y] = actor.chapters[step].focus;
  panel.scrollTo({left:panel.scrollWidth*x - panel.clientWidth/2, top:panel.scrollHeight*y - panel.clientHeight/2});
}
$('enlarge').addEventListener('click',enlarge);
$('web-screen').addEventListener('click',enlarge);
$('close').addEventListener('click',()=>modal.close());
window.addEventListener('hashchange',readLink);
document.addEventListener('visibilitychange',()=>{if(document.hidden) stop();});
reduced.addEventListener('change',stop);
const script = $('script');
copy.forEach((line,i)=>{
  const node=document.createElement([1,3,5,7].includes(i)?'h3':'p');
  node.textContent=line;
  script.append(node);
});
readLink();
