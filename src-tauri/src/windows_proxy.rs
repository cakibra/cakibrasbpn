#[cfg(target_os = "windows")]
pub fn enable_system_proxy(port: u16) -> Result<(), String> {
    use windows::Win32::Networking::WinInet::{
        InternetSetOptionW, INTERNET_OPTION_REFRESH, INTERNET_OPTION_SETTINGS_CHANGED,
    };
    use winreg::{enums::*, RegKey};

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let settings = hkcu
        .open_subkey_with_flags("Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings", KEY_WRITE)
        .map_err(|e| e.to_string())?;
    settings.set_value("ProxyEnable", &1u32).map_err(|e| e.to_string())?;
    settings.set_value("ProxyServer", &format!("127.0.0.1:{}", port)).map_err(|e| e.to_string())?;
    settings
        .set_value("ProxyOverride", &"localhost;127.*;<local>")
        .map_err(|e| e.to_string())?;

    unsafe {
        InternetSetOptionW(None, INTERNET_OPTION_SETTINGS_CHANGED, None, 0)
            .map_err(|e| format!("{e:?}"))?;
        InternetSetOptionW(None, INTERNET_OPTION_REFRESH, None, 0).map_err(|e| format!("{e:?}"))?;
    }
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn disable_system_proxy() -> Result<(), String> {
    use windows::Win32::Networking::WinInet::{
        InternetSetOptionW, INTERNET_OPTION_REFRESH, INTERNET_OPTION_SETTINGS_CHANGED,
    };
    use winreg::{enums::*, RegKey};

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let settings = hkcu
        .open_subkey_with_flags("Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings", KEY_WRITE)
        .map_err(|e| e.to_string())?;
    settings.set_value("ProxyEnable", &0u32).map_err(|e| e.to_string())?;
    let _ = settings.delete_value("ProxyServer");

    unsafe {
        InternetSetOptionW(None, INTERNET_OPTION_SETTINGS_CHANGED, None, 0)
            .map_err(|e| format!("{e:?}"))?;
        InternetSetOptionW(None, INTERNET_OPTION_REFRESH, None, 0).map_err(|e| format!("{e:?}"))?;
    }
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn enable_system_proxy(_port: u16) -> Result<(), String> { Ok(()) }

#[cfg(not(target_os = "windows"))]
pub fn disable_system_proxy() -> Result<(), String> { Ok(()) }

#[cfg(target_os = "windows")]
pub fn set_autostart(exe_path: &std::path::Path, enabled: bool) -> Result<bool, String> {
    use winreg::{enums::*, RegKey};
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu
        .create_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Run")
        .map_err(|e| e.to_string())?
        .0;
    if enabled {
        run_key
            .set_value("CAKIBRA SBP", &format!("\"{}\"", exe_path.display()))
            .map_err(|e| e.to_string())?;
    } else {
        let _ = run_key.delete_value("CAKIBRA SBP");
    }
    Ok(enabled)
}

#[cfg(not(target_os = "windows"))]
pub fn set_autostart(_exe_path: &std::path::Path, enabled: bool) -> Result<bool, String> { Ok(enabled) }
