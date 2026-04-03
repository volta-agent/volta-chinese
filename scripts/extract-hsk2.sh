#!/bin/bash
# Extract HSK2 dialogues from PDF
# HSK2 has 15 lessons

PDF=~/projects/archives/dropbox/HSK2.pdf
OUT=~/projects/volta-chinese/src/lib/data/textbook_dialogues_hsk2_raw.json

# Known lesson page ranges (approximate, will be adjusted)
# Lesson 1: pages 18-20
# Lesson 2: pages 26-28
# etc.

declare -A LESSON_PAGES
LESSON_PAGES[1]="18 19 20"
LESSON_PAGES[2]="26 27 28"
LESSON_PAGES[3]="36 37 38"
LESSON_PAGES[4]="44 45 46"
LESSON_PAGES[5]="52 53 54"
LESSON_PAGES[6]="60 61 62"
LESSON_PAGES[7]="68 69 70"
LESSON_PAGES[8]="78 79 80"
LESSON_PAGES[9]="86 87 88"
LESSON_PAGES[10]="94 95 96"
LESSON_PAGES[11]="102 103 104"
LESSON_PAGES[12]="110 111 112"
LESSON_PAGES[13]="118 119 120"
LESSON_PAGES[14]="126 127 128"
LESSON_PAGES[15]="134 135 136"

for lesson in {1..15}; do
  pages=${LESSON_PAGES[$lesson]}
  echo "=== Lesson $lesson (pages $pages) ==="
  
  rm -f /tmp/hsk2_l${lesson}*.png /tmp/hsk2_l${lesson}*.txt
  
  for page in $pages; do
    pdftoppm -f $page -l $page -png -r 300 "$PDF" "/tmp/hsk2_l${lesson}_p${page}" 2>/dev/null
  done
  
  # OCR all pages for this lesson
  for img in /tmp/hsk2_l${lesson}*.png; do
    tesseract "$img" "${img%.png}" -l chi_sim+eng 2>/dev/null &
  done
  wait
  
  # Combine text
  cat /tmp/hsk2_l${lesson}*.txt > /tmp/hsk2_lesson_${lesson}.txt
done

echo "Extraction complete. Text files in /tmp/hsk2_lesson_*.txt"
