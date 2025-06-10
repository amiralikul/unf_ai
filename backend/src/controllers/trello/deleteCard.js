import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library.js";

/**
 * Delete a Trello card
 * Follows functional approach for consistency with Drive/Gmail controllers
 */
export default function deleteCardController(trelloService, prisma) {
  return async (req, res) => {
    try {
      const { cardId } = req.params;
      const userId = req.user.userId;

      // Validate card ID
      if (!cardId || typeof cardId !== "string") {
        return res.status(400).json({
          error: "Invalid card ID provided"
        });
      }

      // Check if card exists and belongs to user
      // First try to find by database ID, then by trello_id for backwards compatibility
      let existingCard = await prisma.trelloCard.findFirst({
        where: {
          id: cardId,
          user_id: userId
        }
      });

      // If not found by database ID, try by trello_id
      if (!existingCard) {
        existingCard = await prisma.trelloCard.findFirst({
          where: {
            trello_id: cardId,
            user_id: userId
          }
        });
      }

      if (!existingCard) {
        return res.status(404).json({
          error: "Trello card not found or access denied"
        });
      }

      // Use transaction to ensure data integrity using actual database ID
      await prisma.$transaction(async tx => {
        // First, delete any related card-file links that reference this card
        await tx.trelloCardFileLink.deleteMany({
          where: {
            card_id: existingCard.id
          }
        });

        // Then, delete any related card-email links that reference this card
        await tx.trelloCardEmailLink.deleteMany({
          where: {
            card_id: existingCard.id
          }
        });

        // Finally, delete the card itself
        await tx.trelloCard.delete({
          where: {
            id: existingCard.id
          }
        });
      });

      // TODO: Optionally archive/delete in Trello API
      // This would require implementing Trello API delete/archive functionality
      // For now, we just remove from our local database

      res.json({
        message: "Trello card deleted successfully",
        cardId: existingCard.id
      });
    } catch (error) {
      console.error("Error deleting Trello card:", error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return res.status(404).json({
            error: "Trello card not found"
          });
        }
      }

      res.status(500).json({
        error: "Failed to delete Trello card",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  };
}
