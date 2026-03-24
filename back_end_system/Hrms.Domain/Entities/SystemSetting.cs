namespace Hrms.Domain.Entities
{
    public class SystemSetting
    {
        public Guid Id { get; set; }
        public string Key { get; set; } = null!;
        public string Value { get; set; } = null!;
    }

}   
