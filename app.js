/**************************************************
 CSV DATA ANALYSIS (RMS + FFT + ENVELOPE)
**************************************************/
let timeChart, fftChart, envChart;
const fsCSV = 12000; // sampling rate of dataset

document.getElementById("csvFile").addEventListener("change", e => {
  const reader = new FileReader();
  reader.onload = () => {
    const rows = reader.result.trim().split("\n");
    let x = [];

    for (let i = 1; i < rows.length; i++) {
      x.push(parseFloat(rows[i].split(",")[1]));
    }

    analyzeCSV(x);
  };
  reader.readAsText(e.target.files[0]);
});

function analyzeCSV(x) {
  x = removeDC(x);

  const rms = calcRMS(x) * 9.81;
  document.getElementById("csvRMS").innerText = rms.toFixed(2);
  document.getElementById("csvStatus").innerText =
    rms > 2 ? "Faulty" : rms > 1 ? "Warning" : "Normal";

  plotTime(x, "timeChart");
  plotFFT(x, fsCSV, "fftChart");

  // Envelope spectrum
  const env = envelopeSpectrum(x, fsCSV);
  plotEnvelope(env.freq, env.mag);
}

/**************************************************
 LIVE MOBILE ACCELEROMETER (RMS only)
**************************************************/
let liveSamples = [], collecting = false, liveChart;

function startMeasurement() {
  liveSamples = [];
  collecting = true;

  window.addEventListener("devicemotion", motionHandler);

  setTimeout(() => {
    collecting = false;
    window.removeEventListener("devicemotion", motionHandler);
    analyzeLive();
  }, 5000);
}

function motionHandler(e) {
  if (!collecting) return;
  const a = e.accelerationIncludingGravity;
  if (!a) return;

  const mag = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
  liveSamples.push(mag);
}

function analyzeLive() {
  if (liveSamples.length === 0) return;

  const x = removeDC(liveSamples);
  const rms = calcRMS(x);

  document.getElementById("liveRMS").innerText = rms.toFixed(2);
  document.getElementById("liveStatus").innerText =
    rms > 2 ? "Faulty" : rms > 1 ? "Warning" : "Normal";

  plotTime(x, "liveTimeChart");
}

/**************************************************
 SIGNAL PROCESSING UTILITIES
**************************************************/
function removeDC(x) {
  const m = x.reduce((a,b)=>a+b,0)/x.length;
  return x.map(v=>v-m);
}

function calcRMS(x) {
  return Math.sqrt(x.reduce((s,v)=>s+v*v,0)/x.length);
}

/**************************************************
 FFT
**************************************************/
function plotFFT(x, fs, canvasId) {
  const N = 2048;
  let re = new Array(N).fill(0);
  let im = new Array(N).fill(0);

  for (let i=0;i<N;i++) re[i]=x[i]||0;
  fft(re,im);

  let mag = re.slice(0,N/2).map((v,i)=>Math.sqrt(v*v+im[i]*im[i]));
  let freq = mag.map((_,i)=>i*fs/N);

  if (fftChart) fftChart.destroy();
  fftChart = new Chart(document.getElementById(canvasId),{
    type:"line",
    data:{ labels:freq, datasets:[{label:"FFT",data:mag}] }
  });
}

function fft(re, im) {
  const N = re.length;
  if (N<=1) return;

  let er=[], ei=[], or=[], oi=[];
  for (let i=0;i<N;i++)
    (i%2?or:er).push(re[i]),
    (i%2?oi:ei).push(im[i]);

  fft(er,ei); fft(or,oi);

  for (let k=0;k<N/2;k++) {
    const t = -2*Math.PI*k/N;
    const c=Math.cos(t), s=Math.sin(t);
    const tr=c*or[k]-s*oi[k];
    const ti=s*or[k]+c*oi[k];
    re[k]=er[k]+tr; im[k]=ei[k]+ti;
    re[k+N/2]=er[k]-tr; im[k+N/2]=ei[k]-ti;
  }
}

/**************************************************
 ENVELOPE SPECTRUM (DATASET ONLY)
**************************************************/
function envelopeSpectrum(x, fs) {
  let bp = bandpassFIR(x, fs, 500, 1000);
  let env = bp.map(v=>Math.abs(v));
  env = smooth(env, 50);

  const N = 2048;
  let re=new Array(N).fill(0), im=new Array(N).fill(0);
  for (let i=0;i<N;i++) re[i]=env[i]||0;
  fft(re,im);

  let mag=re.slice(0,N/2).map((v,i)=>Math.sqrt(v*v+im[i]*im[i]));
  let freq=mag.map((_,i)=>i*fs/N);

  return {freq,mag};
}

function bandpassFIR(x, fs, f1, f2) {
  const N=101, h=[];
  for (let n=0;n<N;n++) {
    const k=n-(N-1)/2;
    let v=k===0
      ?2*(f2-f1)/fs
      :(Math.sin(2*Math.PI*f2*k/fs)-Math.sin(2*Math.PI*f1*k/fs))/(Math.PI*k);
    h[n]=v*(0.54-0.46*Math.cos(2*Math.PI*n/(N-1)));
  }
  return x.map((_,i)=>h.reduce((s,v,j)=>s+(x[i-j]||0)*v,0));
}

function smooth(x,M) {
  return x.map((_,i)=>{
    let s=0,c=0;
    for (let j=Math.max(0,i-M);j<=i;j++) s+=x[j],c++;
    return s/c;
  });
}

function plotEnvelope(freq, mag) {
  let idx=freq.findIndex(f=>f>500);
  if (envChart) envChart.destroy();
  envChart=new Chart(document.getElementById("envFFTChart"),{
    type:"line",
    data:{ labels:freq.slice(0,idx), datasets:[{label:"Envelope Spectrum",data:mag.slice(0,idx)}] }
  });
}

/**************************************************
 TIME-DOMAIN PLOT
**************************************************/
function plotTime(x, canvasId) {
  const data=x.slice(0,1000);
  const labels=data.map((_,i)=>i);

  if (canvasId==="liveTimeChart" && liveChart) liveChart.destroy();
  if (canvasId==="timeChart" && timeChart) timeChart.destroy();

  const chart=new Chart(document.getElementById(canvasId),{
    type:"line",
    data:{labels,datasets:[{label:"Acceleration",data}]}
  });

  canvasId==="liveTimeChart"?liveChart=chart:timeChart=chart;
}
