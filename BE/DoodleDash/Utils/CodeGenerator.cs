using System.Text;

namespace DoodleDash.Utils
{
    public class CodeGenerator
    {
        private readonly static string availableChars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

        public static string Generate(int length = 5)
        {
            var sb = new StringBuilder();
            for (int i = 0; i < length; i++)
            {
                sb.Append(availableChars[Random.Shared.Next(availableChars.Length)]);
            }
            return sb.ToString();
        }
    }
}