namespace DoodleDash.Utils
{
    static class DefaultWords
    {
        public static readonly List<string> Words = new()
        {
            "apple",
            "house",
            "car",
            "tree",
            "sun",
            "moon",
            "star",
            "fish",
            "bird",
            "cat",
            "dog",
            "book",
            "chair",
            "table",
            "flower",
            "garden",
            "ball",
            "hat",
            "shoe",
            "phone",
            "computer",
            "tv",
            "clock",
            "watch",
            "water",
            "fire",
            "rain",
            "snow",
            "cloud",
            "sky"
        };

        public static List<string> GetRandomWords(int count = 3)
        {
            var random = new Random();
            return Words.OrderBy(_ => random.Next()).Take(count).ToList();
        }
    }
}
