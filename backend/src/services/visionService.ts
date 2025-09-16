import { ImageAnnotatorClient } from '@google-cloud/vision';

class VisionService {
  private client: ImageAnnotatorClient | null = null;
  private credentialsAvailable: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // Initialize the client
      // If you have a service account key file, you can specify it:
      // this.client = new ImageAnnotatorClient({ keyFilename: 'path/to/key.json' });
      //
      // Otherwise, it will use Application Default Credentials (ADC)
      // which can be set via GOOGLE_APPLICATION_CREDENTIALS environment variable
      this.client = new ImageAnnotatorClient();

      // Test credentials by attempting a simple operation
      await this.client.getProjectId();
      this.credentialsAvailable = true;
      console.log('Google Cloud Vision API credentials successfully initialized');
    } catch (error) {
      console.warn('Google Cloud Vision API credentials not available:', error instanceof Error ? error.message : 'Unknown error');
      this.client = null;
      this.credentialsAvailable = false;
    }
  }

  private checkCredentials(): void {
    if (!this.credentialsAvailable || !this.client) {
      throw new Error('Google Cloud Vision API is not available. Please configure your credentials or use an alternative method.');
    }
  }

  /**
   * Extract text from an image buffer using Google Cloud Vision API
   * @param imageBuffer - Buffer containing the image data
   * @returns Promise<string> - Extracted text from the image
   */
  async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    try {
      this.checkCredentials();

      // Perform text detection on the image
      const [result] = await this.client!.textDetection({
        image: {
          content: imageBuffer.toString('base64'),
        },
      });

      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        throw new Error('No text found in the image');
      }

      // The first detection contains all the text found in the image
      const extractedText = detections[0]?.description;

      if (!extractedText || extractedText.trim() === '') {
        throw new Error('No readable text found in the image');
      }

      return extractedText.trim();
    } catch (error) {
      console.error('Error extracting text from image:', error);

      // Check if it's a credentials error
      if (error instanceof Error && error.message.includes('Could not load the default credentials')) {
        throw new Error('Google Cloud Vision API credentials are not configured. Please set up your credentials or use manual recipe entry.');
      }

      // Check if it's our custom credentials check error
      if (error instanceof Error && error.message.includes('Google Cloud Vision API is not available')) {
        throw error;
      }

      throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from an image file path using Google Cloud Vision API
   * @param imagePath - Path to the image file
   * @returns Promise<string> - Extracted text from the image
   */
  async extractTextFromImageFile(imagePath: string): Promise<string> {
    try {
      this.checkCredentials();

      // Perform text detection on the image file
      const [result] = await this.client!.textDetection(imagePath);

      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        throw new Error('No text found in the image');
      }

      // The first detection contains all the text found in the image
      const extractedText = detections[0]?.description;

      if (!extractedText || extractedText.trim() === '') {
        throw new Error('No readable text found in the image');
      }

      return extractedText.trim();
    } catch (error) {
      console.error('Error extracting text from image file:', error);

      // Check if it's a credentials error
      if (error instanceof Error && error.message.includes('Could not load the default credentials')) {
        throw new Error('Google Cloud Vision API credentials are not configured. Please set up your credentials or use manual recipe entry.');
      }

      // Check if it's our custom credentials check error
      if (error instanceof Error && error.message.includes('Google Cloud Vision API is not available')) {
        throw error;
      }

      throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const visionService = new VisionService();