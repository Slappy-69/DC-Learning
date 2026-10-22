# About this guide {#about}

This guide explains the **Data Centre Energy Strategy Tool**: a program that compares energy strategies for a data centre campus at concept stage. It is written for three kinds of reader:

- **Engineers who use the tool.** Part I gets you running; Part III walks through every screen and input.
- **Anyone who needs to trust or check the results.** Parts II and IV explain the ideas behind the tool and how every number is worked out, with formulas and worked examples.
- **Whoever maintains the data.** Part V lists every default value, checks the important ones against published sources, and describes the data sources and APIs (application programming interfaces: the web services a program uses to fetch data) the agreed design needs.

## Which version this guide describes

The tool's owner and Claude walked through the whole user workflow on 21 October 2026 and agreed a set of changes ("the walkthrough"). **This guide describes the tool as agreed in that walkthrough.** Many of those changes are not built yet, so the guide is careful to say which is which:

::: {.callout .built}
**Built.** Part of the current version (model engine 0.2.0-site, on the `main` branch of the repository on 21 October 2026). Screenshots of the current version are labelled "Current version".
:::

::: {.callout .agreed}
**Agreed, not built yet.** Decided in the walkthrough but not yet in the program. Pictures of these screens are mock-ups: drawings of the agreed design, made for this guide, with a striped "MOCK-UP" banner across the top. Their layout and wording are illustrative.
:::

::: {.callout .open}
**Open.** Something the walkthrough did not settle, or a detail that still needs research or a decision. Each one is listed again in chapter 56.
:::

Where the current version and the agreed design differ, both are described: what the program does today, and what it will do.

## How this guide was made

Everything here was taken from primary material, not from memory:

- the program's source code on `main` (the engine files `defaults.js`, `context.js`, `profiles.js`, `generator.js`, `sizing.js`, `dispatch.js`, `evaluate.js`, `scoring.js`, `pareto.js`, `sensitivity.js`, `layout.js`, `sitefit.js` and `run.js`, and the screens in `app/src/components`);
- the design brief (`brief-v2/BRIEF.md`, `ASSUMPTIONS.md`, `OPEN-QUESTIONS.md`) and the build notes;
- the walkthrough decision log and the handoff note in the project;
- a full run of the T1 example (described below), from which every worked example and real screenshot comes;
- a fresh check, on 21 October 2026, of the important default values against published sources (Part V).

While writing, a few things turned up that nobody had noticed before (for example, a small undercount of demand in the repeated "steady-state" year, chapter 54). They are reported as findings; the program has not been changed.

## The guardrail

::: {.callout .warning}
**This is a concept-stage screening tool.** It compares many options quickly with the same simple rules, to show trade-offs and start the right conversations. It is not a design, an electrical study, a permitting assessment or an investment model. Every default value in the current version is labelled "indicative — unverified", and the hourly weather, price and carbon profiles are synthetic (made by the program to match indicative annual figures), not measured data. Check anything that matters before you rely on it.
:::

# How to read this guide {#howto}

The guide has six parts and two appendices.

| Part | What it covers |
|---|---|
| I. Getting started | What the tool does, getting it, a first run, the screen |
| II. Concepts | The ideas you need: PUE, resilience, technologies, the grid, hourly modelling, money, carbon, scoring |
| III. Screen by screen | Every input and every results view |
| IV. Inner workings | How each number is calculated, with formulas and the T1 worked example |
| V. Data and sources | Defaults, published values, country data, data sources, APIs and licences |
| VI. Reference | Limitations, quality checks, status, troubleshooting, glossary, references |
| Appendices | The full register of 496 default values; country data |

If you only want to use the tool, read Part I and the chapters of Part III you need. If you need to explain a result to a client or a reviewer, Part IV is where each number is taken apart.

## Conventions

- **Numbers** use a comma for thousands and a point for decimals: 1,311 m³; 92.71.
- **Money** is in euros (€) unless stated. The engine works in euros; other currencies are shown by converting at a fixed rate.
- **Units:** MW (megawatt, power), MWh (megawatt-hour, energy), MWp (megawatt-peak, the rated output of solar panels), MWth (thermal megawatt, the energy content of fuel burnt per hour), ha (hectare, 10,000 m²), g/kWh (grams of CO₂-equivalent per kilowatt-hour, the same number as kg/MWh).
- **€ m** means million euros. **TWh** is a million MWh.
- **"Option"** means one complete energy strategy: a set of design choices plus the plant sizes that follow from them. **"Run"** means one evaluation of all the options. **"Default"** means the value the program uses when you have not entered one.
- **Choices** are named C1 to C20 (for example C8, cooling approach). The full list is in chapter 20.
- Names of buttons, tabs and fields are in **bold**, or in quotation marks inside sentences.
- Formulas are written out in words and symbols on their own lines, like this:

::: formula
| design load = IT load × (peak PUE + ancillary fraction)
:::

## The T1 example used throughout

Every screenshot and worked example comes from one run of the **T1 reference project**, the example that loads when the program opens. Its inputs are:

| Input | T1 value |
|---|---|
| Location | 52.29° N, 1.53° W (Warwickshire, England) |
| Country profile | United Kingdom (from the location) |
| Analysis start | January 2027 |
| Site area | 15 ha |
| IT load | 100 MW, built as four phases of 25 MW |
| Phase dates | July 2028, 2029, 2030 and 2031 |
| Grid import now | 20 MW |
| Grid import at full connection | 120 MW, from July 2029 |
| Gas available | Yes, from 18 months after the start |
| Everything else | Program defaults |

The run screened **2,000 options** out of 57,028 possible combinations. The leader (rank 1) was:

> **Grid · Diesel N+1 · DLC · PV 7.7 MWp · PPA hybrid 100 %**: wait for the grid connection; diesel backup generators with one spare per block of ten; direct liquid cooling; 7.7 MWp of solar on the roof and the spare ground; and a power purchase agreement for wind and solar energy covering all the site's consumption. Weighted score 92.71 out of 100; levelised cost €153.8/MWh; carbon 113 g/kWh (location-based).

Each worked example in Part IV takes one stage of the calculation for this option and shows the numbers.
