const cpu_pd = 12.375; // kJ/(c*hr)
const mem_pd = 900; // kJ/(128GiB*hr)
const gpu_pd = 1440; // kJ/(gpu*hr)
const lqd_pd = 230; // kJ/(cpu hours)
const air_pd = 720; // kJ/any hours, div by cpu_fac for cpu, by gpu_fac for gpu

// animation
const defaultPlayLength = 15; // Default play length in seconds
const videoDuration = 207; // Video duration in seconds (3 minutes and 27 seconds)
const co2_max = 5.68; // Maximum CO2 value for normalization

const cpu_fac = 104.2;
const gpu_fac = 4;
const ssd_pd = 10.8;

const eff = 1.176;

const car_fac = 16;
const co2_fac = 0.095;


document.addEventListener("DOMContentLoaded", function() {
    var video = document.getElementById('video-background');


    video.onloadedmetadata = function() {
        video.currentTime = 0; // Ensure the video starts at the beginning
    };

    function playSegment(speedInput) {
        const maxPlaybackRate = videoDuration / defaultPlayLength;
        const playbackRate = 1 + (speedInput / co2_max) * (maxPlaybackRate - 1); // Calculate playback rate dynamically

        const segmentDuration = defaultPlayLength; // Segment duration is fixed at 15 seconds

        video.playbackRate = playbackRate;
        video.currentTime = 0;
        video.play();

        setTimeout(() => {
            video.pause();
            // Do not reset currentTime to 0 here
        }, segmentDuration * 1000);
    }

    function calculate() {

        //nia's code
        const ptime = parseFloat(document.getElementById('input1').value);
        const type = document.getElementById('input2').value
        const data = parseFloat(document.getElementById('input3').value);
        const dtime = parseFloat(document.getElementById('input4').value);
        console.log(ptime);
        console.log(type);
        console.log(data);
        console.log(dtime);

        if (isNaN(ptime) || isNaN(data) || isNaN(dtime)) {
            alert("Please enter valid choices in all fields.");
            return;
        }

        let c_part = 0;
        let mem_part = 0;
        let cool_part = 0;
        let adj_time = NaN;
        switch (type) {
            case "thin":
                adj_time = ptime / cpu_fac;
                c_part = ptime * cpu_pd * eff;
                mem_part = adj_time * mem_pd * eff;
                cool_part = adj_time * lqd_pd + air_pd * eff;
            case "fat":
                adj_time = ptime / cpu_fac;
                c_part = ptime * cpu_pd * eff;
                mem_part = adj_time * mem_pd * 2 * eff;
                cool_part = adj_time * lqd_pd + air_pd * eff;
            case "gpu":
                adj_time = ptime / gpu_fac;
                c_part = ptime * gpu_pd * eff;
                mem_part = adj_time * mem_pd * eff / 2;
                cool_part = adj_time * air_pd * 2 * eff;
        }
        const c_draw = (c_part + mem_part + cool_part) / 1000; // as MJ
        const d_draw = (data / 4096) * ssd_pd * dtime * 24 * 60 * 60 / 1000;
        
        const total_draw = (c_draw + d_draw) / 1000;
        const car_km = total_draw / car_fac;
        const co2_total = total_draw / co2_fac;

        //const compute_frac = c_draw / (total_draw * 1000);

        let disp_1 = total_draw;
        if (disp_1 > 10) {
            disp_1 = Math.round(total_draw);
        }
        else {
            disp_1 = Math.round(total_draw * 100) / 100;
        }

        let disp_2 = co2_total;
        if (disp_2 > 10) {
            disp_2 = Math.round(co2_total);
        }
        else {
            disp_2 = Math.round(co2_total * 100) / 100;
        }

        let disp_3 = car_km;
        if (disp_3 > 10) {
            disp_3 = Math.round(car_km);
        }
        else {
            disp_3 = Math.round(car_km * 100) / 100;
        }

        document.getElementById('result1').querySelector('.result-value').innerText = disp_1;
        document.getElementById('result2').querySelector('.result-value').innerText = disp_2;
        document.getElementById('result3').querySelector('.result-value').innerText = disp_3;

        
        if (!isNaN(disp_2)) {
            // Normalize disp_2 based on co2_max
            const normalizedCO2Value = Math.min(Math.max(disp_2, 0), co2_max);
            return normalizedCO2Value;
        } else {
            alert('Please ensure the CO2 emissions value is valid.');
            return null;
        }
    }

    document.querySelector('.calculate-button').addEventListener('click', function() {
        const co2Value = calculate();
        if (co2Value !== null) {
            playSegment(co2Value);
        }
    });
});


