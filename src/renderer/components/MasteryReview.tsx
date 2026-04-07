import React, { useState, useEffect } from 'react'

interface ReviewCard {
  id: number
  lessonDefId: string
  concept: string
  question: string
  answer: string
  interval: number
  reviewCount: number
}

export default function MasteryReview() {
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  useEffect(() => {
    loadCards()
  }, [])

  async function loadCards() {
    const due = await window.api.getDueReviewCards(20)
    setCards(due)
    setLoading(false)
    if (due.length === 0) setSessionComplete(true)
  }

  async function handleRate(quality: number) {
    const card = cards[currentIndex]
    await window.api.submitReview(card.id, quality)
    setReviewed(reviewed + 1)

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    } else {
      setSessionComplete(true)
    }
  }

  if (loading) return <div className="lesson-loading">Loading review cards...</div>

  if (sessionComplete) {
    return (
      <div className="review-complete">
        <div className="review-complete-icon">{'\u2705'}</div>
        <h2>{reviewed > 0 ? 'Review Complete!' : 'All Caught Up!'}</h2>
        <p>
          {reviewed > 0
            ? `You reviewed ${reviewed} concept${reviewed !== 1 ? 's' : ''}. Great work keeping your knowledge fresh.`
            : 'No review cards are due right now. Complete more lessons to add concepts for review.'}
        </p>
      </div>
    )
  }

  const card = cards[currentIndex]
  const progress = `${currentIndex + 1} / ${cards.length}`

  return (
    <div className="mastery-review">
      <div className="review-header">
        <h1>Mastery Review</h1>
        <div className="review-progress">{progress}</div>
      </div>

      <div className="review-progress-bar">
        <div className="review-progress-fill" style={{ width: `${((currentIndex) / cards.length) * 100}%` }} />
      </div>

      <div className="review-card-container">
        <div className="review-card">
          <div className="review-card-meta">
            <span className="review-concept-tag">{card.concept}</span>
            <span className="review-card-stats">
              reviewed {card.reviewCount}x
              {card.interval > 1 && ` \u00B7 ${card.interval}d interval`}
            </span>
          </div>

          <div className="review-question">
            <h3>Question</h3>
            <p>{card.question}</p>
          </div>

          {!showAnswer ? (
            <button className="btn-primary review-show-btn" onClick={() => setShowAnswer(true)}>
              Show Answer
            </button>
          ) : (
            <>
              <div className="review-answer">
                <h3>Answer</h3>
                <p>{card.answer}</p>
              </div>

              <div className="review-rating">
                <p className="rating-prompt">How well did you know this?</p>
                <div className="rating-buttons">
                  <button className="rating-btn rating-0" onClick={() => handleRate(0)} title="Complete blackout">
                    <span className="rating-emoji">{'\u274C'}</span>
                    <span>Forgot</span>
                  </button>
                  <button className="rating-btn rating-2" onClick={() => handleRate(2)} title="Wrong but remembered after seeing answer">
                    <span className="rating-emoji">{'\u{1F914}'}</span>
                    <span>Hard</span>
                  </button>
                  <button className="rating-btn rating-3" onClick={() => handleRate(3)} title="Correct with difficulty">
                    <span className="rating-emoji">{'\u{1F44D}'}</span>
                    <span>Good</span>
                  </button>
                  <button className="rating-btn rating-5" onClick={() => handleRate(5)} title="Perfect, instant recall">
                    <span className="rating-emoji">{'\u2B50'}</span>
                    <span>Easy</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
