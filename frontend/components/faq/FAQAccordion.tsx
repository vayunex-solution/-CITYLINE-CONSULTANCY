'use client';

import React, { useState } from 'react';
import { FAQItem } from '@/lib/types/website.types';
import styles from './FAQAccordion.module.css';

interface FAQAccordionProps {
  items: FAQItem[];
  defaultOpenIndex?: number;
}

export function FAQAccordion({ items, defaultOpenIndex = 0 }: FAQAccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([defaultOpenIndex]);

  const toggleIndex = (index: number) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter((i) => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  return (
    <div className={styles.accordion}>
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);
        return (
          <div key={item.id} className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
            <button
              type="button"
              className={styles.trigger}
              onClick={() => toggleIndex(index)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${item.id}`}
            >
              <span>{item.question}</span>
              <span className={`${styles.icon} ${isOpen ? styles.iconRotated : ''}`} aria-hidden="true">
                +
              </span>
            </button>
            {isOpen && (
              <div id={`faq-answer-${item.id}`} className={styles.content}>
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
