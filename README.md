# Morris–Lecar Simulator

A standalone classroom browser simulator, styled like the PolyQual game. No MATLAB, build step, external libraries, or network assets are required. Open `index.html` directly, or serve this folder:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Open <http://127.0.0.1:8766/>. On localhost or HTTPS, a service worker caches the app for subsequent offline use. Public app: [Morris–Lecar Simulator](https://gregconradismith.github.io/morris-lecar-simulator/). The standalone public repository serves its main branch at the root with GitHub Pages.

Use Run/Pause, restart, or depolarize the current state by 15 mV. Click inside the phase plane to restart from that voltage and potassium activation. Adjust applied current, conductances, or potassium rate; applied-current changes preserve state, time, and history; other model parameter changes restart the trajectory. Presets reset all model parameters. CSV exports the selected visible trace window (including transients and any voltage kicks), with time, voltage, activation, and applied current. Playback speed changes wall-clock playback only.

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

Default playback is 0.01× (1/100 speed), including after Reset all. Playback speeds range from 0.001× (one thousandth of real time) to 10×. Fractional integration steps accumulate across animation frames so the slowest speeds advance correctly without changing the fixed RK4 time step. At 0.001×, one second of playback advances the model by one millisecond.

The phase-plane trajectory tail has its own duration control: 0–500 ms of model time, default 100 ms. Use the slider or enter an exact whole number of milliseconds. Zero hides the path while keeping the current-state marker. Changing tail duration redraws immediately without restarting; it uses the retained 10,000 ms of history and is independent of trace window and playback speed. Restart clears history, presets preserve tail duration, and Reset all restores 100 ms.

Trace windows: 50, 100, 250, 500, 1,000, 2,000, 5,000, and 10,000 ms. The simulator retains 10,000 ms of history, so enlarging the window reveals available prior data without restarting. CSV uses the selected trace window. At startup or after restart, the window fills as model time advances.

The full phase-plane view displays w from −0.2 to 1.2. The extra margin is visual: initial conditions chosen by clicking remain restricted to the physical gating interval 0–1. Near-rest zoom retains its focused 0–0.15 range.

Type II also includes a depolarization-block preset at I = 250 µA/cm². With the standard Type II parameters, initial spikes decay and the state approaches a stable equilibrium at V ≈ +10.90 mV, w ≈ 0.6441. Compare with sustained firing at I = 100 or 200 µA/cm². Applied-current control extends to 400 µA/cm². This is block in the reduced calcium/potassium model; it does not model sodium-channel inactivation.

## Saddle manifolds

Enable **Stable saddle manifold** and/or **Unstable saddle manifold** under Phase-plane layers. Choose Type I below onset (I = 39 µA/cm²) to see a saddle and both branches of each manifold. Purple long dashes show the stable manifold; orange short dashes show the unstable manifold. The stable manifold approaches the saddle in forward time and locally separates trajectories; unstable branches leave it. The manifold controls appear only when a Type I starting example is selected and the current parameters have a detected saddle. They disappear when the saddle is lost, including in the Type I firing presets; hidden manifold layers are not drawn. Layers follow the actual model equilibria after parameter edits.

Curves are numerical approximations. The Jacobian is evaluated by centered differences (1e-4 in each variable); its real positive and negative eigenvectors provide seeds on both sides of the saddle, offset by 1e-5 in coordinates scaled by the full plot spans. Stable branches use backward RK4 and unstable branches use forward RK4, with |Δt| = 0.05 ms. Each branch runs at most 2,000 ms, stopping at a full-view boundary, near an equilibrium, or on a nonfinite step. The near-rest view clips these same curves. Near a nonhyperbolic bifurcation, root detection and finite tracing time can miss or incompletely resolve a manifold. These are guides to phase-plane geometry, not exact global separatrices. Computation is cached between parameter/layer changes; the trajectory tail does not trim manifold curves.

Verification checks both eigenvector branches for forward attraction or repulsion, empty layers without a saddle, and convergence of a transverse-section intersection after halving the integration step.

Applied current is recorded per sample and plotted as a step trace below w, with the same time window as voltage and activation and units µA/cm². Moving the current slider changes the drive at the current model time without resetting V, w, time, or either trajectory. The step is visible immediately, including while paused; subsequent integration uses the new current. CSV retains the actual historical current values. Phase-plane nullclines, equilibria, field, and manifolds update to the instantaneous current; historical trajectory segments may belong to earlier currents. Choosing a starting preset, Restart trajectory, or a new phase-plane initial condition still starts a new simulation.

Run `node verify-interaction.cjs` for a browser-independent interaction regression check covering paused/running current changes, state/history continuity, the subsequent response under the new current, historical-current CSV data, and explicit restart.

**Download PNG**, beside Export CSV, downloads a single PNG containing the phase plane, voltage, w, and applied-current traces at the instant clicked. It includes model time, trace/tail windows, model parameters with units, and visible curve legends. The snapshot captures the current views and does not reset or pause the simulation.
