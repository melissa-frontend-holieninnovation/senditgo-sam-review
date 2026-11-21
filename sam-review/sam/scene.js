import { copy } from './approved.js';

const cast = [
  { id:'mate', film:'run-mate-film.mp4?v=3c50ba925113', name:'The Run Mate', bio:'Inspired by Samwise Gamgee, the mate who stays when the job gets hard. At the depot laptop, he helps the dispatcher fit a late drop into the run. She makes the final call.',
    shots:['SAM checks the late drop on the laptop with the dispatcher beside him.', 'He points to the stop where the late drop could fit.', 'She checks the route and clicks to confirm it. SAM steps back.'] },
  { id:'loader', film:'load-planner-film.mp4?v=3d1fcb4318d3', name:'The Load Planner', bio:'He checks the cartons against the space in the delivery SUV before the run leaves the depot.',
    shots:['SAM opens the load plan on his laptop beside the two cartons.', 'He checks the width of the larger carton at the bench.', 'He points out the load plan on the laptop so his teammate can review it.'] },
  { id:'relay', film:'relay-driver-film.mp4?v=66fbd6f50302', name:'The Relay Driver', bio:'He handles the late shift on a regional run. At changeover, he makes sure the incoming driver has the latest plan.',
    shots:['At dusk, SAM checks the next run on the depot laptop.', 'He uses the radio to talk through the changeover.', 'The incoming driver takes the keyboard and reviews the run with SAM beside him.'] }
];
const stages = [
  {detail:'Dispatch opens the order on Sophie Taylor’s route.'},
  {detail:'Dispatch reviews the proposed insertion on Olivia Parker’s run and its estimated effect on time and distance.'},
  {detail:'After reassignment, Order Status shows the order on Olivia’s receiving run sheet.'}
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
  const stage = stages[step];
  $('name').textContent = actor.name;
  $('bio').textContent = actor.bio;
  $('caption').textContent = actor.shots[step];
  $('frame').style.backgroundImage = 'url(./sam/' + actor.id + '.webp?v=' + (actor.id === 'mate' ? 'ef27a849367e' : '8') + ')';
  $('frame').style.backgroundPositionX = (step * 50) + '%';
  $('frame').setAttribute('aria-label', actor.shots[step]);
  $('product-caption').textContent = stage.detail;
  if (screen instanceof HTMLImageElement) {
    const src = './sam/fleet-' + (step + 1) + '.webp';
    if (screen.getAttribute('src') !== src) screen.src = src;
    screen.alt = stage.detail;
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
  panel.scrollTo({left:Math.max(0,(panel.scrollWidth-panel.clientWidth)*.5), top:step===1 ? panel.scrollHeight : 0});
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
