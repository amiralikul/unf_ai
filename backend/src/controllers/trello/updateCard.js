import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js';

/**
 * Update a Trello card
 * Follows functional approach for consistency with Drive/Gmail controllers
 */
export default function updateCardController(trelloService, prisma) {
  return async (req, res) => {
    try {
      const { cardId } = req.params;
      const { name, description, status, priority, dueDate } = req.body;
      const userId = req.user.userId;

      // Validate card ID
      if (!cardId || typeof cardId !== 'string') {
        return res.status(400).json({
          error: 'Invalid card ID provided'
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
          error: 'Trello card not found or access denied'
        });
      }

      // Prepare update data (using snake_case field names to match Prisma schema)
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.due_date = dueDate ? new Date(dueDate) : null;

      // Update in database using the actual database ID
      const updatedCard = await prisma.trelloCard.update({
        where: {
          id: existingCard.id
        },
        data: {
          ...updateData,
          updated_at: new Date()
        }
      });

      // TODO: Optionally sync back to Trello API
      // This would require implementing Trello API update functionality
      // For now, we just update our local database

      res.json({
        message: 'Trello card updated successfully',
        card: updatedCard
      });

    } catch (error) {
      console.error('Error updating Trello card:', error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(409).json({
            error: 'A card with this name already exists in the board'
          });
        }
        if (error.code === 'P2025') {
          return res.status(404).json({
            error: 'Trello card not found'
          });
        }
      }

      res.status(500).json({
        error: 'Failed to update Trello card',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
} 