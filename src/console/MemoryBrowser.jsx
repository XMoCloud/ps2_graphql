import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { memoryCards, questGroups } from "./catalog";
import { xp } from "./data";
import { SaveIcon, SaveInformation } from "./MemorySave";
import MemoryCardModel from "./MemoryCardModel";
import { MEMORY_FADE_MS, SAVE_STAGGER_MS, SAVE_REVEAL_MS, DETAIL_ENTER_MS, SAVES_PER_PAGE, saveAppearance } from "./memoryMotion";
import { useExperience } from "../experience/Experience";
import { playOpenSound, playBackSound, playHoverSound } from "../lib/sound";

export default function MemoryBrowser({ data }) {
  const cards = useMemo(() => memoryCards(data), [data]);
  const e = useExperience(), location = useLocation(), navigate = useNavigate();
  const [cardId, setCardId] = useState(null), [quest, setQuest] = useState(null);
  const [item, setItem] = useState(null), [selected, setSelected] = useState(-1);
  const [page, setPage] = useState(0), [fade, setFade] = useState(null);
  const [reading, setReading] = useState(false), [sequence, setSequence] = useState(0);
  const [closingDetail, setClosingDetail] = useState(false);
  const loadedSaves = useRef(new Set());
  const dialog = useRef(null), timers = useRef(new Set()), readTimer = useRef(null);
  const changing = useRef(false), lastCard = useRef(null), initial = useRef(false);
  const card = cards.find(c => c.id === cardId);
  const items = useMemo(() => card ? (quest ? quest.items : questGroups(card)) : [], [card, quest]);
  const pages = Math.max(1, Math.ceil(items.length / SAVES_PER_PAGE));
  const visible = items.slice(page * SAVES_PER_PAGE, (page + 1) * SAVES_PER_PAGE);
  const focused = selected < 0 ? null : visible[selected];
  const appearance = item ? saveAppearance(item) : null;
  const busy = Boolean(fade) || reading;

  const later = (callback, ms) => {
    const id = setTimeout(() => { timers.current.delete(id); callback(); }, ms);
    timers.current.add(id);
    return id;
  };
  const readSaves = records => {
    clearTimeout(readTimer.current);
    timers.current.delete(readTimer.current);
    const pending = records.filter(record => !loadedSaves.current.has(record.key));
    setSequence(n => n + 1);
    setSelected(pending.length ? -1 : records.length ? 0 : -1);
    setReading(pending.length > 0);
    if (!pending.length) return;
    readTimer.current = later(() => {
      pending.forEach(record => loadedSaves.current.add(record.key));
      setReading(false);
      setSelected(records.length ? 0 : -1);
    }, e.motion ? pending.length * SAVE_STAGGER_MS + SAVE_REVEAL_MS : 80);
  };
  const transition = (commit, duration = MEMORY_FADE_MS) => {
    if (changing.current) return;
    changing.current = true;
    const ms = e.motion ? duration : 80;
    setFade({ phase: "out", ms });
    later(() => {
      commit();
      setFade({ phase: "in", ms });
      later(() => { setFade(null); changing.current = false; }, ms);
    }, ms);
  };
  const chooseCard = (chosen, initialItem = null) => {
    if (changing.current) return;
    lastCard.current = chosen.id;
    loadedSaves.current.clear();
    e.setMemoryAudioSuspended(true);
    playOpenSound();
    transition(() => {
      const folder = initialItem ? questGroups(chosen).find(group => group.isQuest && group.items.some(save => save.key === initialItem.key)) || null : null;
      const list = folder ? folder.items : questGroups(chosen);
      const index = initialItem ? Math.max(0, list.findIndex(save => save.key === initialItem.key)) : 0;
      setCardId(chosen.id); setQuest(folder); setPage(Math.floor(index / SAVES_PER_PAGE)); setItem(initialItem);
      if (initialItem) setSelected(index % SAVES_PER_PAGE);
      if (initialItem) list.slice(Math.floor(index / SAVES_PER_PAGE) * SAVES_PER_PAGE, (Math.floor(index / SAVES_PER_PAGE) + 1) * SAVES_PER_PAGE).forEach(save => loadedSaves.current.add(save.key));
      else readSaves(list.slice(0, SAVES_PER_PAGE));
    });
  };

  useLayoutEffect(() => {
    if (!cardId) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    e.setWorldObscured(true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      e.setWorldObscured(false);
      e.setMemoryAudioSuspended(false);
      document.body.style.overflow = previous;
    };
  }, [cardId]);
  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    e.setWorldObscured(false);
    e.setMemoryAudioSuspended(false);
  }, []);
  useEffect(() => {
    if (!cardId || reading || fade) return;
    const target = item ? ".memory-detail-back" : ".save-browser-item.is-selected";
    dialog.current?.querySelector(target)?.focus({ preventScroll: true });
  }, [cardId, item, quest, page, reading, fade]);
  useEffect(() => {
    if (initial.current || !location.state?.card) return;
    const chosen = cards.find(c => c.id === location.state.card);
    if (!chosen) return;
    initial.current = true;
    chooseCard(chosen, chosen.items.find(r => r.key === location.state.item) || null);
    navigate(location.pathname, { replace: true, state: null });
  }, [cards]);

  const back = () => {
    if (changing.current) return;
    playBackSound();
    if (item) {
      changing.current = true;
      setClosingDetail(true);
      later(() => { setItem(null); setClosingDetail(false); changing.current = false; }, e.motion ? DETAIL_ENTER_MS : 80);
      return;
    }
    transition(() => {
      clearTimeout(readTimer.current);
      if (quest) {
        setQuest(null); setPage(0);
        readSaves(questGroups(card).slice(0, SAVES_PER_PAGE));
      } else {
        setReading(false); setCardId(null); setSelected(-1);
        loadedSaves.current.clear();
        later(() => [...document.querySelectorAll("[data-card-id]")].find(node => node.dataset.cardId === lastCard.current)?.focus({ preventScroll: true }), 0);
      }
    }, quest ? 650 : MEMORY_FADE_MS);
  };
  const open = record => {
    if (busy || changing.current) return;
    playOpenSound();
    if (record.isQuest) {
      transition(() => {
        setQuest(record); setPage(0);
        readSaves(record.items.slice(0, SAVES_PER_PAGE));
      }, 650);
    } else { setClosingDetail(false); setItem(record); }
  };
  const changePage = next => {
    if (busy || changing.current || next < 0 || next >= pages) return;
    playOpenSound(); setPage(next);
    readSaves(items.slice(next * SAVES_PER_PAGE, (next + 1) * SAVES_PER_PAGE));
  };
  const gridKeys = (event, selector) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (changing.current || reading) return;
    const buttons = [...event.currentTarget.querySelectorAll(selector)];
    if (!buttons.length) return;
    const current = Math.max(0, buttons.indexOf(document.activeElement));
    const columns = getComputedStyle(event.currentTarget).gridTemplateColumns.split(" ").length;
    const step = ["ArrowUp", "ArrowDown"].includes(event.key) ? columns : 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : (current + (["ArrowRight", "ArrowDown"].includes(event.key) ? step : -step) + buttons.length) % buttons.length;
    buttons[next]?.focus(); playHoverSound();
  };

  const fader = fade && <div className={`memory-fader memory-fade-${fade.phase}`} style={{ "--memory-fade-ms": `${fade.ms}ms` }} aria-hidden="true" />;
  return <div className="memory-library">
    <div className="memory-library-intro"><p>Select a memory card</p></div>
    <div className="memory-card-grid" onKeyDown={event => gridKeys(event, "[data-card-id]")}>
      {cards.map((c, index) => <button className="memory-card-choice" key={c.id} data-card-id={c.id}
        onClick={() => chooseCard(c)} onMouseEnter={event => { event.currentTarget.focus({ preventScroll: true }); playHoverSound(); }} style={{ "--card-accent": c.color }}>
        <span className="card-choice-heading"><small>MEMORY CARD {String(index + 1).padStart(2, "0")}</small><strong>{c.name}</strong><i aria-hidden="true">▼</i></span>
        <MemoryCardModel card={c} number={index} />
        <span className="card-choice-caption">{c.items.length} saves <i /> {xp(c.xp)}<small>{c.passed} passed{c.level != null ? ` · Level ${c.level}` : ""}</small></span>
      </button>)}
    </div>
    {createPortal(<>
      {!cardId && fader}
      <dialog ref={dialog} className={`memory-browser-dialog ${item ? "memory-detail-mode" : ""} ${closingDetail ? "detail-is-closing" : ""}`}
        aria-labelledby={item ? "save-detail-title" : "memory-browser-title"}
        onCancel={event => { event.preventDefault(); back(); }}
        onKeyDown={event => {
          if (event.key === "Backspace" && !["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) {
            event.preventDefault(); back();
          }
        }}>
        {card && <>
          <div className="memory-browser-surface" aria-hidden={item ? true : undefined}>
            <header className="memory-browser-header">
              <div><h2 id="memory-browser-title">{card.name}{quest ? ` / ${quest.name}` : ""}</h2>
                <p>{quest ? quest.items.length : card.items.length} saved {card.id === "module" ? "projects" : "exercises"} · {xp(card.xp)} earned</p></div>
              <span>{reading ? card.name : focused?.name || card.name}</span>
            </header>
            <div key={`${cardId}-${quest?.key || ""}-${page}-${sequence}`} className="save-browser-grid"
              aria-label="Saved progress" aria-busy={reading} onKeyDown={event => gridKeys(event, ".save-browser-item")}>
              {visible.map((record, index) => <button key={record.key}
                className={`save-browser-item ${selected === index ? "is-selected" : ""} ${loadedSaves.current.has(record.key) ? "is-loaded" : ""}`}
                style={{ "--save-delay": `${e.motion ? visible.slice(0, index).filter(save => !loadedSaves.current.has(save.key)).length * SAVE_STAGGER_MS : 0}ms` }}
                disabled={busy || Boolean(item)}
                onFocus={() => { if (!reading) setSelected(index); }}
                onMouseEnter={event => { if (!reading && !fade && !item) { event.currentTarget.focus({ preventScroll: true }); setSelected(index); playHoverSound(); } }}
                onClick={() => open(record)}
                aria-label={record.isQuest ? `Open ${record.name}, ${record.items.length} exercises` : `View ${record.name}, ${record.status}`}>
                <span className="save-icon-stage"><span className="save-icon-reveal"><SaveIcon item={record} /></span></span>
                <strong>{record.name}</strong>
              </button>)}
            </div>
            {!visible.length && <p className="memory-no-saves">No saves on this card yet.</p>}
            {reading && <div className="memory-loading" role="status">Now Loading...</div>}
            <footer className="memory-footer">
              <button className="memory-back" disabled={Boolean(fade) || Boolean(item)} onClick={back}>Back</button>
              {pages > 1 && <nav className="memory-pagination" aria-label="Save pages">
                <button disabled={page === 0 || busy || Boolean(item)} onClick={() => changePage(page - 1)}>Previous</button>
                <span>{page + 1} / {pages}</span>
                <button disabled={page + 1 >= pages || busy || Boolean(item)} onClick={() => changePage(page + 1)}>Next</button>
              </nav>}
              <span className="memory-page-range">{visible.length ? `${page * SAVES_PER_PAGE + 1}–${page * SAVES_PER_PAGE + visible.length} / ${items.length}` : ""}</span>
            </footer>
          </div>
          {item && <section className="save-detail-layer" style={{ "--detail-theme": appearance.theme, "--detail-light": appearance.light }}>
            <div className="save-detail-view">
              <div className="save-detail-model"><SaveIcon item={item} large /><span className="save-model-shadow" /></div>
              <div className="save-detail-info"><SaveInformation item={item} userId={data.user?.id} /></div>
            </div>
            <button className="memory-detail-back" onClick={back}>Back</button>
          </section>}
          {fader}
        </>}
      </dialog>
    </>, document.body)}
  </div>;
}
