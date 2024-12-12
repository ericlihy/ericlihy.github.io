# Superhero Data Visualization Project

## Overview
This project presents an interactive storytelling experience that explores the characteristics that define superheroes and villains throughout comic book history. Users embark on a journey through Xavier's School for Gifted Youngsters, where they can explore hero attributes, test their own potential abilities, and discover how they might fare as a superhero.

## Project Links
- **Website**: https://ericlihy.github.io/
- **Screencast**: https://drive.google.com/file/d/1kxC89HNecjww1ZklIgd27O5TXWc0KNhE/view?usp=drive_link

## Implementation Details

### Original Work
- Custom interactive visualizations using D3.js:
    - Network graph showing hero relationships and affiliations with the user's stats implemented in (which we test for through interactive and fun games)
    - Interactive bar charts displaying hero attributes by alignment
    - Radar charts for your comparisons against other heroes and villains
    - World map visualization of hero origins with the ability to add your hometown
- Original artwork and designs:
    - All background images and UI elements
    - Custom hero attribute icons
    - Xavier's School branding elements
- Interactive tests and quizzes:
    - Intelligence assessment (through logic-based quiz and the Hanoi Tower problem)
    - Strength calculator
    - Speed reaction test
    - Durability challenge 
- Extensive data preprocessing and cleaning:
    - Standardization of hero attributes
    - Resolution of inconsistent data entries
    - Creation of relationship networks
    - Geographic data normalization

### External Libraries and Resources
- **Tower of Hanoi Implementation**: Based on an existing implementation (credited in hanoi.js) but significantly modified to integrate with our project's architecture and scoring system
- **Dot Navigation**: Utilizes the Easy Scroll Dots library (credited in scroll.js) for smooth section navigation
- **D3.js**: Used for creating custom visualizations
- **Other standard libraries**: Bootstrap for basic styling, Papaparse for CSV handling

## Non-Obvious Features

### Navigation
- Starting video and music to go along with it (a mesh of Marvel and DC intros)
- Dot sidebar navigation allows direct jumping to any section when dot is clicked on
- Smooth scrolling transitions between sections
- Progress tracking through the story

### Attribute tests
- Intelligence
  - This test includes a few quick questions, followed by solving the Towers of Hanoi problem. We then combine these scores to create the User's overall Intelligence Score.
- Reaction Speed: 
  - This test requires the User to click a button quickly after bring prompted to test reaction speed. This test is composed of 5 trails. All scores are averaged to find the User's overall Reaction Speed Score. A graph is displayed comparing the User's results for each trial.
- Strength:
  - This test is composed of the User selecting their max lifts across the 3 main lifts in the sport of Powerlifting. These scores are taken a percentage of the highest possible lift, then all 3 scores are averaged to find the User's overall Strength Score. 
- Durability 
  - This test requires the User to click the space bar as many times as possible in 30 seconds. The score is calculated by combining the total number of clicks and the User's deceleration across the 30 seconds. 

### Interactive Elements
- Network graph:
    - Hovering over nodes reveal hero relationships
    - Draggable nodes for network exploration
    - Fully interactive with physics
    - User's traits also input into network graph
- Bar chart:
    - Dynamic attribute selection
    - Animated transitions between different data views
- Comprehensive scoring system:
    - Backend calculations for all quiz results
    - Weighted scoring based on multiple factors
    - Persistent score tracking across sections
    - Live updating once tests are complete
- The Towers of Hanoi:
  - The "I Give Up" button provides an animation of the rings solving it
- Radar Chart Comparison Tool:
  - Interactivity to compare yourself to any character to see how your traits compare to theirs

### Data Processing
- Extensive dataset cleaning involving:
    - Normalization of power levels
    - Resolution of duplicate entries
    - Standardization of publisher information
    - Creation of relationship networks
    - Geographic data verification and cleanup


## Team Members
- Eric Li
- Rohan Naidoo
- Chris Canzano
- Shahmir Aziz
