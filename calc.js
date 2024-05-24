const cpu_pd = 12.375; // kJ/(core*hour)
const mem_pd = 2000; // kJ/(~290GiB*hour), appx 290GiB is RAM in thin nodes
const gpu_pd = 1440; // kJ/(gpu*hour)
const lqd_pd = 230; // kJ/(cpu*hour)
const air_pd = 720; // kJ/(cpu or gpu*hour), div by cpu_fac for cpu, by gpu_fac for gpu
const ssd_pd = 260; // kJ/(day*ssd)

// animation
const defaultPlayLength = 15; // Default play length in seconds
const videoDuration = 207; // Video duration in seconds (3 minutes and 27 seconds)
let co2_max = 5000; // Maximum CO2 value for normalization

const cpu_fac = 166.4; // 40% Rome CPUs, 60% Genoa CPUs, so avg the # of cores
const gpu_fac = 4; // Around 4 GPUs in a node

const fat_weight = 1.5;
const gpu_weight = 128;

const eff = 2; // (Generously) assume 50% grid power efficiency overall

const car_fac = 1.6; // 1km by car = 16MJ
const co2_fac = 27.7; // 1kg CO2 = 27.7 MJ

const comparables = [
    ["Taking the train from Amsterdam to Rotterdam", 10],
    ["Taking the train from Amsterdam to Berlin", 84],
    ["The daily energy usage of a Dutch resident", 552],
    ["Driving from London to Birmingham", 5260],
    ["Driving from Paris to Moscow", 45648],
    ["Flying from Brussels to Madrid", 291182],
    ["Flying to the moon and back", 2272000],
    ["Detonating the bomb dropped on Hiroshima", 63000000],
];
const cmp_len = comparables.length;

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

        function closest_log(nr, arr) {
            let best = nr / arr[0][1]; // arr is 2D
            let best_idx = 0;
            if (best < 1) {
                return 1;
            } // We now know nr is at least bigger than the 1st val so can assume it

            for (let i = 1; i < arr.length; i++) { // Yes, 1 here, not 0
                const c_elem = arr[i][1];
                let c_r = nr / c_elem;
                if (c_r < 1) {
                    c_r = c_elem / nr;
                }
                if (c_r < best) {
                    best = c_r;
                    best_idx = i;
                }
            }

            if (best_idx == 0) {
                return 1;
            }
            else if (best_idx == 7) {
                return 6;
            }
            else {
                return best_idx;
            }
        }

        //nia's code
        const ptime = parseFloat(document.getElementById('input1').value);
        const type = document.getElementById('input2').value;
        // Some data is generated during, so let's be generous
        const data = parseFloat(document.getElementById('input3').value) * 0.8;
        const dtime = parseFloat(document.getElementById('input4').value);

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
                break;
            case "fat":
                adj_time = ptime / (cpu_fac * fat_weight);
                c_part = ptime * cpu_pd * eff / fat_weight;
                mem_part = adj_time * mem_pd * 4.2 * eff;
                cool_part = adj_time * lqd_pd + air_pd * eff;
                break;
            case "gpu":
                adj_time = ptime / (gpu_fac * gpu_weight);
                c_part = ptime * gpu_pd * eff / gpu_weight;
                mem_part = adj_time * mem_pd * eff / 2;
                cool_part = adj_time * air_pd * 2 * eff;
                co2_max = 30000; // GPUs use more energy, so this is fair
                break;
        }
        const c_draw = c_part / 1000; // as MJ
        const l_draw = cool_part / 1000; // as MJ
        const m_draw = mem_part / 1000; // as MJ
        const d_draw = data * ssd_pd * 4 * dtime / (1000 * 4096);
        //      4x repl for redundancy ^     as MJ ^   drives ^

        const total_draw = c_draw + l_draw + m_draw + d_draw;
        const car_km = total_draw / car_fac;
        const co2_total = total_draw / co2_fac;

        const c_frac = Math.round((c_draw + l_draw) * 1000 / total_draw) / 10;
        const m_frac = Math.round(m_draw * 1000 / total_draw) / 10;
        const d_frac = Math.round(d_draw * 1000 / total_draw) / 10;

        let r1_txt = "Megajoules of energy used";
        let r2_txt = "Kg of CO2 emitted";
        let r3_txt = "Km driven by car"
        let disp_1 = total_draw;
        let disp_2 = co2_total;
        let disp_3 = car_km;

        // Change units if too big to read easily
        if (disp_1 >= 10000) {
            disp_1 = disp_1 / 1000;
            r1_txt = "Gigajoules of energy used";
        }

        if (disp_2 >= 10000) {
            disp_2 = disp_2 / 1000;
            r2_txt = "Tonnes of CO2 emitted";
        }

        if (disp_3 >= 10000) {
            disp_3 = disp_3 / 1000;
            r3_txt = "Thousands of km driven by car";
        }

        if (disp_1 > 10) {
            disp_1 = Math.round(disp_1);
        }
        else {
            disp_1 = Math.round(disp_1 * 100) / 100;
        }

        if (disp_2 > 10) {
            disp_2 = Math.round(disp_2);
        }
        else {
            disp_2 = Math.round(disp_2 * 100) / 100;
        }

        if (disp_3 > 10) {
            disp_3 = Math.round(disp_3);
        }
        else {
            disp_3 = Math.round(disp_3 * 100) / 100;
        }

        const comp_2_idx = closest_log(total_draw, comparables);
        const comp_1_idx = Math.floor(Math.random() * comp_2_idx);
        // max: cmp_len - 1
        // min: comp_2_idx + 1
        // (max - min + 1) = cmp_len - 1 - comp_2_idx - 1 + 1 = cmp_len - comp_2_idx - 1
        const comp_3_idx = Math.floor(Math.random() * (cmp_len - comp_2_idx - 1)) + comp_2_idx + 1;

        console.log(comp_2_idx);
        console.log(comp_3_idx);

        let comp_1_val = total_draw / comparables[comp_1_idx][1];
        let comp_2_val = total_draw / comparables[comp_2_idx][1];
        let comp_3_val = total_draw / comparables[comp_3_idx][1];
        
        if (comp_1_val > 10) {
            comp_1_val = Math.round(comp_1_val);
        }
        else {
            comp_1_val = comp_1_val.toPrecision(3);
        }
        if (comp_2_val > 10) {
            comp_2_val = Math.round(comp_2_val);
        }
        else {
            comp_2_val = comp_2_val.toPrecision(3);
        }
        if (comp_3_val > 10) {
            comp_3_val = Math.round(comp_3_val);
        }
        else {
            comp_3_val = comp_3_val.toPrecision(3);
        }

        const comp_1 = comparables[comp_1_idx][0] + " " + comp_1_val + " times";
        const comp_2 = comparables[comp_2_idx][0] + " " + comp_2_val + " times";
        const comp_3 = comparables[comp_3_idx][0] + " " + comp_3_val + " times";

        const frac_1 = c_frac + "% from processors & cooling";
        const frac_2 = d_frac + "% from data storage";
        const frac_3 = m_frac + "% from RAM usage";

        document.getElementById('result1').querySelector('.result-value').innerText = disp_1;
        document.getElementById('result2').querySelector('.result-value').innerText = disp_2;
        document.getElementById('result3').querySelector('.result-value').innerText = disp_3;
        document.getElementById('result1').querySelector('.result-text').innerText = r1_txt;
        document.getElementById('result2').querySelector('.result-text').innerText = r2_txt;
        document.getElementById('result3').querySelector('.result-text').innerText = r3_txt;
        document.getElementById('comp1').innerText = comp_1;
        document.getElementById('comp2').innerText = comp_2;
        document.getElementById('comp3').innerText = comp_3;
        document.getElementById('bkd1').innerText = frac_1;
        document.getElementById('bkd2').innerText = frac_2;
        document.getElementById('bkd3').innerText = frac_3;

        if (!isNaN(disp_2)) {
            // Normalize disp_2 based on co2_max
            const normalizedCO2Value = Math.min(Math.max(co2_total, 0), co2_max);
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


