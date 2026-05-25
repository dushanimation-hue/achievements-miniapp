import { db } from './db';

/**
 * Update challenge progress for a user when they earn XP from an approved achievement.
 * This should be called whenever an achievement is approved (either via moderation or auto-approve).
 *
 * Logic:
 * 1. Find all active challenge participations for this user
 * 2. For each participation where the challenge direction matches the achievement direction (or is 'ALL'):
 *    - Increment xpCollected by the awarded XP
 *    - If xpCollected >= xpTarget and not yet completed:
 *      - Mark as completed, set completedAt
 *      - Award rewardXp to user's totalXp
 */
export async function updateChallengeProgress(
  userId: string,
  xpAwarded: number,
  achievementDirection: string | null
): Promise<void> {
  if (!userId || xpAwarded <= 0) return;

  // Find all active challenge participations for this user
  const participations = await db.challengeParticipant.findMany({
    where: {
      userId,
      completed: false,
      challenge: { isActive: true },
    },
    include: { challenge: true },
  });

  for (const participation of participations) {
    const challenge = participation.challenge;

    // Check if the challenge direction matches the achievement direction
    // 'ALL' direction means any achievement counts
    const directionMatches =
      challenge.direction === 'ALL' ||
      challenge.direction === achievementDirection ||
      (achievementDirection && achievementDirection.split(',').map(d => d.trim()).includes(challenge.direction));

    if (!directionMatches) continue;

    // Increment xpCollected
    const newXpCollected = participation.xpCollected + xpAwarded;

    // Check if challenge is now completed
    if (newXpCollected >= challenge.xpTarget) {
      // Mark as completed and award bonus XP
      await db.challengeParticipant.update({
        where: { id: participation.id },
        data: {
          xpCollected: newXpCollected,
          completed: true,
          completedAt: new Date(),
        },
      });

      // Award reward XP to the user
      await db.user.update({
        where: { id: userId },
        data: { totalXp: { increment: challenge.rewardXp } },
      });

      console.log(`[Challenge] User ${userId} completed challenge "${challenge.title}"! Awarded ${challenge.rewardXp} bonus XP.`);
    } else {
      // Just update the progress
      await db.challengeParticipant.update({
        where: { id: participation.id },
        data: { xpCollected: newXpCollected },
      });
    }
  }
}
