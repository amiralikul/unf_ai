// Import Jest functions
import { jest, describe, test, beforeEach, expect } from "@jest/globals";
import { LinkDetectionService } from "../LinkDetectionService.js";

// Mock Prisma client
const mockPrisma = {
  trelloCard: {
    findFirst: jest.fn()
  },
  file: {
    findFirst: jest.fn()
  },
  trelloCardFileLink: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  trelloCardEmailLink: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
};

describe("LinkDetectionService", () => {
  let linkDetectionService;

  beforeEach(() => {
    linkDetectionService = new LinkDetectionService(mockPrisma);
    jest.clearAllMocks();
  });

  describe("extractTrelloCardReferences", () => {
    test("should extract Trello card URLs", () => {
      const text =
        "Check out this card: https://trello.com/c/abc123def and also trello.com/c/xyz789ghi";
      const refs = linkDetectionService.extractTrelloCardReferences(text);
      expect(refs).toEqual(["abc123def", "xyz789ghi"]);
    });

    test("should extract custom card IDs", () => {
      const text = "Working on #PROJ-123 and #TASK-456";
      const refs = linkDetectionService.extractTrelloCardReferences(text);
      expect(refs).toEqual(["PROJ-123", "TASK-456"]);
    });

    test("should handle empty or null text", () => {
      expect(linkDetectionService.extractTrelloCardReferences("")).toEqual([]);
      expect(linkDetectionService.extractTrelloCardReferences(null)).toEqual([]);
      expect(linkDetectionService.extractTrelloCardReferences(undefined)).toEqual([]);
    });

    test("should deduplicate references", () => {
      const text = "https://trello.com/c/abc123 and https://trello.com/c/abc123";
      const refs = linkDetectionService.extractTrelloCardReferences(text);
      expect(refs).toEqual(["abc123"]);
    });
  });

  describe("extractDriveFileReferences", () => {
    test("should extract Google Docs URLs", () => {
      const text = "See document: https://docs.google.com/document/d/1abc123def/edit";
      const refs = linkDetectionService.extractDriveFileReferences(text);
      expect(refs).toEqual(["1abc123def"]);
    });

    test("should extract Google Drive file URLs", () => {
      const text = "File: https://drive.google.com/file/d/1xyz789ghi/view";
      const refs = linkDetectionService.extractDriveFileReferences(text);
      expect(refs).toEqual(["1xyz789ghi"]);
    });

    test("should extract Google Drive open URLs", () => {
      const text = "Link: https://drive.google.com/open?id=1abc123xyz";
      const refs = linkDetectionService.extractDriveFileReferences(text);
      expect(refs).toEqual(["1abc123xyz"]);
    });

    test("should handle multiple file types", () => {
      const text = `
        Doc: https://docs.google.com/document/d/1doc123/edit
        Sheet: https://docs.google.com/spreadsheets/d/1sheet456/edit
        Drive: https://drive.google.com/file/d/1file789/view
      `;
      const refs = linkDetectionService.extractDriveFileReferences(text);
      expect(refs).toEqual(["1doc123", "1sheet456", "1file789"]);
    });

    test("should deduplicate file references", () => {
      const text =
        "https://docs.google.com/document/d/1abc123/edit and https://drive.google.com/file/d/1abc123/view";
      const refs = linkDetectionService.extractDriveFileReferences(text);
      expect(refs).toEqual(["1abc123"]);
    });
  });

  describe("findCardByTrelloId", () => {
    test("should find card by Trello ID", async () => {
      const mockCard = { id: "card1", trello_id: "abc123", name: "Test Card" };
      mockPrisma.trelloCard.findFirst.mockResolvedValue(mockCard);

      const result = await linkDetectionService.findCardByTrelloId("abc123", "user1");

      expect(mockPrisma.trelloCard.findFirst).toHaveBeenCalledWith({
        where: {
          trello_id: "abc123",
          user_id: "user1"
        }
      });
      expect(result).toEqual(mockCard);
    });

    test("should return null if card not found", async () => {
      mockPrisma.trelloCard.findFirst.mockResolvedValue(null);

      const result = await linkDetectionService.findCardByTrelloId("nonexistent", "user1");
      expect(result).toBeNull();
    });

    test("should handle database errors gracefully", async () => {
      mockPrisma.trelloCard.findFirst.mockRejectedValue(new Error("DB Error"));

      const result = await linkDetectionService.findCardByTrelloId("abc123", "user1");
      expect(result).toBeNull();
    });
  });

  describe("findFileByGoogleId", () => {
    it("should find file by Google ID", async () => {
      const mockFile = { id: "file1", google_id: "1abc123", name: "Test File" };
      mockPrisma.file.findFirst.mockResolvedValue(mockFile);

      const result = await linkDetectionService.findFileByGoogleId("1abc123", "user1");

      expect(mockPrisma.file.findFirst).toHaveBeenCalledWith({
        where: {
          google_id: "1abc123",
          user_id: "user1"
        }
      });
      expect(result).toEqual(mockFile);
    });
  });

  describe("linkCardToFile", () => {
    test("should create new link if none exists", async () => {
      mockPrisma.trelloCardFileLink.findUnique.mockResolvedValue(null);
      const mockLink = { id: "link1", card_id: "card1", file_id: "file1" };
      mockPrisma.trelloCardFileLink.create.mockResolvedValue(mockLink);

      const result = await linkDetectionService.linkCardToFile(
        "card1",
        "file1",
        "reference",
        "user1"
      );

      expect(mockPrisma.trelloCardFileLink.findUnique).toHaveBeenCalledWith({
        where: {
          card_id_file_id: {
            card_id: "card1",
            file_id: "file1"
          }
        }
      });
      expect(mockPrisma.trelloCardFileLink.create).toHaveBeenCalledWith({
        data: {
          card_id: "card1",
          file_id: "file1",
          link_type: "reference",
          created_by: "user1"
        }
      });
      expect(result).toEqual(mockLink);
    });

    test("should return existing link if already exists", async () => {
      const existingLink = { id: "link1", card_id: "card1", file_id: "file1" };
      mockPrisma.trelloCardFileLink.findUnique.mockResolvedValue(existingLink);

      const result = await linkDetectionService.linkCardToFile("card1", "file1");

      expect(mockPrisma.trelloCardFileLink.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingLink);
    });
  });

  describe("processCardText", () => {
    it("should process card text and create file links", async () => {
      const cardText = "Working on https://docs.google.com/document/d/1abc123/edit";
      const mockFile = { id: "file1", google_id: "1abc123" };
      const mockLink = { id: "link1", card_id: "card1", file_id: "file1" };

      mockPrisma.file.findFirst.mockResolvedValue(mockFile);
      mockPrisma.trelloCardFileLink.findUnique.mockResolvedValue(null);
      mockPrisma.trelloCardFileLink.create.mockResolvedValue(mockLink);

      const result = await linkDetectionService.processCardText("card1", cardText, "user1");

      expect(result.fileLinks).toHaveLength(1);
      expect(result.fileLinks[0]).toEqual(mockLink);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle files not found in database", async () => {
      const cardText = "Working on https://docs.google.com/document/d/1nonexistent/edit";
      mockPrisma.file.findFirst.mockResolvedValue(null);

      const result = await linkDetectionService.processCardText("card1", cardText, "user1");

      expect(result.fileLinks).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("processEmailText", () => {
    it("should process email text and create card links", async () => {
      const emailText = "Regarding https://trello.com/c/abc123";
      const mockCard = { id: "card1", trello_id: "abc123" };
      const mockLink = { id: "link1", card_id: "card1", email_id: "email1" };

      mockPrisma.trelloCard.findFirst.mockResolvedValue(mockCard);
      mockPrisma.trelloCardEmailLink.findUnique.mockResolvedValue(null);
      mockPrisma.trelloCardEmailLink.create.mockResolvedValue(mockLink);

      const result = await linkDetectionService.processEmailText("email1", emailText, "user1");

      expect(result.cardLinks).toHaveLength(1);
      expect(result.cardLinks[0]).toEqual(mockLink);
      expect(result.errors).toHaveLength(0);
    });
  });
});
