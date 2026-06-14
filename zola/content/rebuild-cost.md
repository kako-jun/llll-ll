+++
title = "About the “rebuild cost”"
template = "post.html"
+++

The “rebuild cost” shown on each app card is **an estimate of the cost to rebuild that software from scratch, by hand**. It is not the time or money the author actually spent, but the cost of producing the finished result again from the ground up — its replacement value.

## Background

In current software development, the amount of AI-agent usage affects how much and what quality can be produced. Most companies use AI on a metered, usage-based basis. Finished software can be acquired in its completed state, without the development time or the metered cost. The rebuild cost is a reference figure for evaluating such an acquisition or transfer.

## How it is calculated

Line count alone cannot distinguish repetitive code from novel code, so the estimate is made in two stages.

1. **Lines of code (SLOC) are measured with [scc](https://github.com/boyter/scc)**, counting code and data (CSV / JSON / YAML, etc.) separately.
2. A rule shared by all apps is applied to those lines to estimate effort.

```
effort (person-months) = fixed overhead 0.5
                + code lines ÷ code speed
                + data lines ÷ data speed

rebuild cost (USD) = effort × $7,000 / month   (rounded)
```

The speeds are lines that can be produced by hand, finished and reviewed, per month, divided by difficulty.

| Code tier | Speed | Example |
|---|---|---|
| Hard (novel low-level / graphics / reverse-engineering / engines) | 1,800 lines/mo | orber (GPU / WGSL) |
| Standard (typical web / CLI / game / app) | 3,500 lines/mo | most |
| Repetitive (many similar parts, config-driven) | 7,000 lines/mo | tail-match (scrapers for 47 prefectures) |

| Data tier | Speed | Example |
|---|---|---|
| Authored (translations, legal text, linguistic data) | 9,000 lines/mo | noun-gender, osaka-kenpo |
| Config / generated | 50,000 lines/mo | the rest |

The fixed overhead of 0.5 person-months is the minimum design, testing and release cost incurred regardless of size. The $7,000 / month rate is a standard rate for a skilled contractor.

### Consistency

The only per-app judgment is the tier assignment; the figure follows from the rule. Individual apps are not adjusted on their own. To change the scale, a shared coefficient such as the monthly rate is changed and applied to all apps at once.

The tier assignments were made by **Claude Opus 4.8**, reading each app’s source code and description and following the criteria above, which serve as the instructions for the judgment. The procedure is reproducible and applies the same rule as apps are added.

## Notes

- For apps with few lines, the cost per line is higher, because of the fixed overhead. The line count is the final result; the trial, error and review behind it are included in the overhead.
- “Building by hand” includes the time to become able to work with the technology. Becoming able to write in a new language takes years.
- This is not a precise quote, but a single rule applied uniformly to every app.
