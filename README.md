# Morris–Lecar Simulator

A standalone classroom browser simulator, styled like the PolyQual game. No MATLAB, build step, external libraries, or network assets are required. Open `index.html` directly, or serve this folder:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Open <http://127.0.0.1:8766/>. On localhost or HTTPS, a service worker caches the app for subsequent offline use. Public app: [Morris–Lecar Simulator](https://gregconradismith.github.io/morris-lecar-simulator/). The standalone public repository serves its main branch at the root with GitHub Pages.

Use Run/Pause, restart, or depolarize the current state by 15 mV. Click inside the phase plane to restart from that voltage and potassium activation. Adjust applied current, conductances, or potassium rate; parameter changes restart the trajectory. Presets reset all model parameters. CSV exports the selected visible trace window (including transients and any voltage kicks), with time, voltage, activation, and applied current. Playback speed changes wall-clock playback only.

The app implements the reduced two-variable model in course primer Chapter 14, Eqs. 14.2–14.3: instantaneous calcium activation and voltage-dependent potassium relaxation. The default conventional parameter set is C=20 µF/cm², gCa=4.4, gK=8, gL=2 mS/cm²; ECa=120, EK=−84, EL=−60 mV; V1=−1.2, V2=18, V3=2, V4=30 mV; φ=0.04 ms⁻¹. These are an explicit teaching parameter choice, not a fit to biological data or a claim to reproduce every primer figure. Model background: https://www.scholarpedia.org/article/Morris-Lecar and https://www.scholarpedia.org/article/Stochastic_models_of_ion_channel_gating/JAW_SCM_morris_lecar_gillespie.m.

Integration uses fourth-order Runge–Kutta with fixed Δt=0.05 ms, independent of animation rate. The phase plane shows the same applied current as the traces; nullclines are instantaneous zero-derivative curves, not trajectories. Direction-field arrows are normalized in plot coordinates. Presets demonstrate responses from V=−60 mV and w=w∞(−60); they are not automated bifurcation classifications.

Numerical verification: `node verify.cjs` checks equilibrium behavior, repetitive firing, gating bounds across slider extremes, and convergence when the integration step is halved.

## Type I and Type II classroom examples

The phase plane is shown first, with independent V and w nullcline switches, normalized direction arrows, and equilibria classified by the local Jacobian (filled circle: stable, open circle: unstable, diamond: saddle). “Near rest” zooms to V = −65 to 5 mV and w = 0 to 0.15; trajectories outside that region are clipped. Root finding brackets simple equilibrium roots on −80 to 60 mV; an exactly tangent root at a bifurcation can be missed. Markers are local stability information, not a global bifurcation analysis.

| Parameter | Type I (SNIC regime) | Type II (Hopf regime) |
| --- | --- | --- |
| gCa (mS/cm²) | 4 | 4.4 |
| V3 (mV) | 12 | 2 |
| V4 (mV) | 17.4 | 30 |
| φ (ms⁻¹) | 0.067 | 0.04 |
| Current examples (µA/cm²) | 39, 40, 45 | 88, 90, 100, 250 (block) |

Other parameters retain their defaults. These conventional sets are also listed in the [published model description](https://repository.essex.ac.uk/35643/1/s41598-023-34807-3.pdf); this app uses ordinary first-order time derivatives.

Type I presets automatically select a 2,000 ms trace window so slow firing is visible. Compare I = 40, 40.1, 41, and 45 µA/cm² near the onset around 39.96 µA/cm². The orbit spends a long time near the former saddle/node location. Type II onset has finite firing frequency; compare I = 88 and 90 µA/cm² from the default initial condition. In the subcritical Hopf regime, coexistence and initial-condition dependence mean the onset observed in a current sweep need not equal the equilibrium stability boundary.

A finite check with 2 s discarded and 6 s observed gives no repeated spikes at Type I I=39 µA/cm² or Type II I=88 µA/cm², approximately 1.06 Hz at Type I I=40 µA/cm², 10.08 Hz at Type I I=45 µA/cm², and 9.73 Hz at Type II I=90. These samples illustrate the contrast; they do not prove the limiting bifurcation behavior. `verify.cjs` checks this comparison plus nullcline residuals and saddle/stable equilibrium markers. Editing any parameter shows a custom-parameter note because the starting preset's classification may no longer apply.

Playback speeds range from 0.001× (one thousandth of real time) to 10×. Fractional integration steps accumulate across animation frames so the slowest speeds advance correctly without changing the fixed RK4 time step. At 0.001×, one second of playback advances the model by one millisecond.

The phase-plane trajectory tail has its own duration control: 0–2,000 ms of model time, default 100 ms. Use the slider or enter an exact whole number of milliseconds. Zero hides the path while keeping the current-state marker. Changing tail duration redraws immediately without restarting; it uses the retained 10,000 ms of history and is independent of trace window and playback speed. Restart clears history, presets preserve tail duration, and Reset all restores 100 ms.

Trace windows: 50, 100, 250, 500, 1,000, 2,000, 5,000, and 10,000 ms. The simulator retains 10,000 ms of history, so enlarging the window reveals available prior data without restarting. CSV uses the selected trace window. At startup or after restart, the window fills as model time advances.

The full phase-plane view displays w from −0.2 to 1.2. The extra margin is visual: initial conditions chosen by clicking remain restricted to the physical gating interval 0–1. Near-rest zoom retains its focused 0–0.15 range.

Type II also includes a depolarization-block preset at I = 250 µA/cm². With the standard Type II parameters, initial spikes decay and the state approaches a stable equilibrium at V ≈ +10.90 mV, w ≈ 0.6441. Compare with sustained firing at I = 100 or 200 µA/cm². Applied-current control extends to 400 µA/cm². This is block in the reduced calcium/potassium model; it does not model sodium-channel inactivation.
